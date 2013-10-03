var fs = require("fs");
var path = require("path");
var url = require("url");

function get_mime(filename) {
    var ext = path.extname(filename).toLowerCase();
    switch (ext.replace(/^\./, "")) {
      case "html"   :
      case "htm"    : return "text/html; charset=UTF-8";
      case "xml"    : return "text/xml; charset=UTF-8";
      case "txt"    :
      case "map"    :
      case "text"   : return "text/plain; charset=UTF-8";
      case "md"     : return "text/x-markdown; charset=UTF-8";
      case "json"   :
      case "js"     : return "text/javascript; charset=UTF-8";
      case "css"    : return "text/css; charset=UTF-8";
      case "less"   : return "text/x-less; charset=UTF-8";
      case "coffee" : return "text/coffeescript; charset=UTF-8";
      case "jpg"    :
      case "jpeg"   : return "image/jpeg";
      case "png"    : return "image/png";
      case "gif"    : return "image/gif";
      case "ico"    : return "image/x-icon";
      case "zip"    : return "application/zip";
      case "gz"     : return "application/x-gzip";
      case "svg"    : return "image/svg+xml";
      case "ttf"    : return "application/x-font-ttf";
      case "otf"    : return "application/x-font-opentype";
      case "woff"   : return "application/font-woff";
      case "eot"    : return "application/vnd.ms-fontobject";
    }
    return "application/octet-stream";
};

function send_404(response, pathname) {
    response.writeHead(404, "Not found", {
        "Content-Type": get_mime("x.txt")
    });
    response.write("404: " + pathname + " not found");
    response.end();
};

function serve_file(pathname, response) {
    fs.stat(pathname, function(err, stat){
        if (err) {
            if (err.code == "ENOENT") {
                send_404(pathname);
            } else {
                response.writeHead(500, { "Content-Type": "text/plain" });
                response.write(err + "\n");
                response.end();
            }
            return;
        }
        if (stat.isDirectory())
            pathname = path.join(pathname, "index.html");
        fs.readFile(pathname, "binary", function(err, content){
            if (err) {
                response.writeHead(500, { "Content-Type": "text/plain" });
                response.write(err + "\n");
                response.end();
            } else {
                serve_content(content, pathname, response);
            }
        });
    });
};

function serve_content(content, pathname, response) {
    response.writeHead(200, "OK", {
        "Content-Type"   : get_mime(pathname),
        "Content-Length" : content.length,
        "Pragma"         : "no-cache",
        "Expires"        : "Tue, 08 Mar 1979 06:00:00 GMT",
        "Last-Modified"  : new Date().toGMTString(),
        "Cache-Control"  : "no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0",
    });
    response.write(content, "binary");
    response.end();
};

var TRY_MINIFIED = false;

exports.handle_request = function(docroot, request, response) {
    var is_qhint = request.headers["x-qhint"];
    var pathname = request.url.replace(/\?.*$/, "");
    var filename = path.join(docroot, pathname);
    fs.exists(filename, function(exists){
        if (!exists) {
            send_404(response, pathname);
            return;
        }
        var minified = filename.replace(/(js|css)$/, "min.$1");
        if (minified != filename && TRY_MINIFIED && !is_qhint) {
            fs.exists(minified, function(exists){
                serve_file(exists ? minified : filename, response);
            });
        } else {
            serve_file(filename, response);
        }
    });
};

exports.serve_content = serve_content;
