功能：
监听webpack emit hook将complation asserts中的资源加入到appcache配置文件中
生成加载器js在html被缓存的时候实时加载加载器js，在加载器js中加载最新的入口js

example:

    new serviceWorkerWebpack({
        filename:'service.appcache',
        exclude:[/_bridge\.3\.1\.3\.js$/,
            /_dll\.vendor\.js$/,
            /_jweixin-1\.3\.2\.js$/],
        includeFiles:[
            "//test.40017.cn/dll.vendor.js",
            "//res.wx.qq.com/open/js/jweixin-1.3.2.js"
        ]
    })
