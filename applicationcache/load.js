!(function (){
    var appCache = window.applicationCache;
    var doc = window.document;
    var toString = Object.prototype.toString;
    var entryFile = "__ENTRY__FILE__";
    var entyrFileDocker = "__ENTRY__DOCKER__";

    function isArray (obj){
        return toString.call(obj) === "[object Array]";
    }
    //  离线缓存
    if (appCache) {
        // 更新
        appCache.addEventListener(
            "cached",
            function () {
            },
            false
        );
        // 更新
        appCache.addEventListener(
            "updateready",
            function () {
                // 立即生效，所有的资源全部加载为最新的了
                try{
                    appCache.swapCache();
                }catch(e){}
            },
            false
        );
        // 无更新
        appCache.addEventListener(
            "noupdate",
            function () {
            },
            false
        );
        // 异常
        appCache.addEventListener(
            "error",
            function () {
            },
            false
        );
    }

    // 加载js入口文件
    if(isArray(entryFile)){
        entryFile.map((entry,index)=>{
            loadJS(entry,entyrFileDocker[index]);
        });
    }else{
        loadJS(entryFile,entyrFileDocker);
    }
    // TODO 加载css入口文件

    function loadJS (url,fallbackUrl) {
        var script = doc.createElement("script");
        script.async = true;
        script.src = url;
        script.onerror = function (){
            window._webpack_public_path_ = "./";
            if(fallbackUrl){
                this.parentNode.removeChild(this);
                loadJS(fallbackUrl);
            }
        };
        doc.body.appendChild(script);
    }
})();