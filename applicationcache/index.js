const fs = require("fs");
const path = require("path");
const loadJSFile = "load.js";
const loadJSPath = path.resolve(__dirname,loadJSFile);

class AppCache{
    constructor (){
        this.assets = [];
    }
    addAssert (assert){
        this.assets.push(assert);
    }
    getManifestBody (){
        return [
            this.assets.length ? `${this.assets.join("\n")}\n` : ""
        ].join("\n");
    }
    size (){
        return Buffer.byteLength(this.source(), "utf8");
    }
    source (){
        return [
            "CACHE MANIFEST",
            this.getManifestBody(),
            "NETWORK:",
            "*"
        ].join("\n");
    }
}

class ServiceWorkerPlugin{
    constructor (params){
        this.serviceFileName = params.filename;
        this.exclude = params.exclude || [];
        this.includeFiles = params.includeFiles || [];
    }
    apply (compiler){
        const {publicPath} = compiler.options.output;
        const buildService = (compilation)=>{
            const cache = new AppCache({});
            Object.keys(compilation.assets)
                .filter(ass=>{
                    return !this.exclude.some(pattern => pattern.test(ass));
                })
                .forEach(assert=>{
                    if(/html$/.test(assert)){
                        // 重写html文件 写入缓存文件
                        compilation.assets[assert] = makeHtml(compilation,assert,this.serviceFileName,publicPath);
                        // 生成加载器js 避免首页缓存 页面不变
                        compilation.assets[loadJSFile] = makeLoadjs(compilation,publicPath);
                    }else{
                        cache.addAssert(publicPath + assert);
                    }
                });
            // 包含的文件
            this.includeFiles && this.includeFiles.length > 0 && this.includeFiles.forEach(file=>{
                cache.addAssert(file);
            });
            compilation.assets[this.serviceFileName] = cache;
        };

        compiler.hooks.emit.tap("ServiceWorkerPlugin",buildService);
    }
}

// 重写生成的html文件
function makeHtml (compilation,assert,manifestName,publicPath){
    let text = compilation.assets[assert].source();
    // 在application cache下 index.html默认会被缓存，使用js加载器解决缓存问题
    // 替换manifest属性
    let entryPointArr = getEntryFile(compilation,publicPath);

    // 入口文件替换
    entryPointArr.map(item=>{
        text = replaceEntry(text,item);
    });

    // 替换manifest
    text = text.replace(/(<html[^>]*)(>)/i, (match, start, end) => {
        // Append the manifest only if no manifest was specified
        if (/\smanifest\s*=/.test(match)) {
            return match;
        }
        return start + " manifest=\"" + manifestName + "\"" + end;
    });
    
    return {
        size (){
            return Buffer.byteLength(this.source(), "utf8");
        },
        source (){
            return text;
        }
    };
}

// 获取入口文件
function getEntryFile (compilation,publicPath=""){
    const entryNames = Array.from(compilation.entrypoints.keys());
    const arr = [];
    for (let i = 0; i < entryNames.length; i++) {
        const entryName = entryNames[i];
        let file = compilation.entrypoints.get(entryName).getFiles();
        arr.push(publicPath + file);
    }
    return arr;
}

// 替换入口文件
function replaceEntry (text,replaceStr){
    let entryIndex = text.indexOf(replaceStr);
    let entryScriptStartIndex = text.slice(0,entryIndex).lastIndexOf("<script");
    let entryScriptEndIndex = text.indexOf("</script>",entryScriptStartIndex);
    let start = text.slice(0,entryScriptStartIndex);
    let end = text.slice(entryScriptEndIndex + 9);
    let replacetxt = "<script>document.write('<script src=\".\/" + loadJSFile + "\?_=' + (new Date).getTime() + '" + "\"><\\/script>');<\/script>";
    // let replacetxt = "<script>var scriptDom = document.createElement(\"script\");scriptDom.async = true;scriptDom.src = \""+loadJSFile+"?_="+(new Date).getTime()+"\";document.body.appendChild(scriptDom);</script>";
    return start + replacetxt + end;
}

// 生成加载器js文件
function makeLoadjs (compilation,publicPath){
    let entryPointArr = getEntryFile(compilation);
    let entrystr = entryPointArr.map(r=>"\"" + publicPath + r + "\"").join(",");
    let entryFallbackStr = entryPointArr.map(r=>"\"" +r+ "\"").join(",");
    let loadjs = fs.readFileSync(loadJSPath,"utf8");
    loadjs = loadjs.replace(/[',"]__ENTRY__FILE__[',"]/,`[${entrystr}]`)
        .replace(/[',"]__ENTRY__DOCKER__[',"]/,`[${entryFallbackStr}]`);
    return {
        size (){
            return Buffer.byteLength(this.source(), "utf8");
        },
        source (){
            return loadjs;
        }
    };
}

module.exports = ServiceWorkerPlugin;