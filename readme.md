example:

    new serviceWorkerWebpack({
        filename:'service.appcache',
        exclude:[/_bridge\.3\.1\.3\.js$/,
            /_dll\.vendor\.js$/,
            /_jweixin-1\.3\.2\.js$/],
        includeFiles:[
            "//file.40017.cn/train4in1/miniapp/dll.vendor.js",
            "//res.wx.qq.com/open/js/jweixin-1.3.2.js"
        ]
    })