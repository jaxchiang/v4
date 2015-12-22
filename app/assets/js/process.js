;
(function() {

    'use strict';

    // 1. helpers
    // 1.1. 模拟 $.ajax()
    function ajax(url, opts) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            var completed = 4;
            if (xhr.readyState === completed) {
                if (xhr.status === 200) {
                    opts.success(xhr.responseText, xhr);
                } else {
                    opts.error(xhr.responseText, xhr);
                }
            }
        };
        xhr.open(opts.method, url, true);
        xhr.send(opts.data);
    }
    // 1.2. $.type()
    var class2type = {};
    "Boolean Number String Function Array Date RegExp Object Error".split(" ").forEach(function(e, i) {
        class2type["[object " + e + "]"] = e.toLowerCase();
    });

    function _typeof(obj) {
        if (obj == null) {
            return String(obj);
        }
        return typeof obj === "object" || typeof obj === "function" ?
            class2type[class2type.toString.call(obj)] || "object" :
            typeof obj;
    }


    // 2. 生成进度/索引表
    ajax('../assets/js/process.json', {
        method: 'GET',
        success: function(response) {

            // 2.0. 初始化
            var jsonObj = JSON.parse(response),
                options = jsonObj.options,
                pages = jsonObj.pages,
                tableContainer = document.getElementById('container'),
                tableEl = document.createElement('table'),
                tbodyEl = document.createElement('tbody');

            // 初始化表格
            (function() {
                var tableText = '',
                    theadText = '',
                    processBar = '',
                    coltype = options.coltype;
                for (var i = 0, coltypeLen = coltype.length; i < coltypeLen; i++) {
                    theadText += '<th>' + coltype[i] + '</th>';
                }
                processBar = '<tr><td colspan="' + coltype.length + '"><div class="blueBar">' + '</div></td></tr>'
                tableText = '<caption>' + options.title + '</caption><thead><tr>' + theadText + '</tr></thead><tfoot>' + processBar + '<tr><td colspan="' + coltype.length + '">重构负责人：' + options.author + ' | 座机：' + options.telephone + '</tr></tfoot>';
                tableEl.innerHTML = tableText;
            })();
            tableContainer.appendChild(tableEl);

            // 2.1. 生成内容列表
            (function() {
                var tbodyText = '',
                    hrefText = '';

                for (var i = 0, itemsLen = pages.length; i < itemsLen; i++) {
                    // 这里这样取值 hrefText 是因为，如果没有 url 的链接，但是仍然有 href 的话，<a> 是可以点击，而且跳转的，我希望没有 url 的<a>就是文本，不能点击
                    hrefText = pages[i].content.url ? ('href="' + pages[i].content.url + '"') : '';
                    // bigScreen = _typeof(pages[i].bigscreen) === "number" ? pages[i].bigscreen + '%' : pages[i].bigscreen;
                    // normalScreen = _typeof(pages[i].normalscreen) === "number" ? pages[i].normalscreen + '%' : pages[i].normalscreen;
                    // mobileScreen = _typeof(pages[i].mobile) === "number"?pages[i].mobile + '%':pages[i].mobile;

                    tbodyText += '<tr><td>' + pages[i].date + '</td><td><a ' + hrefText + ' target="_blank">' + pages[i].content.name + '</a></td>';
                    var iconText = '<td>';
                    for (var j = 0, iconLen = pages[i].compatibility.length; j < iconLen; j++) {
                        iconText += '<i class="' + pages[i].compatibility[j] + '"></i>';
                    }
                    iconText += '</td>';
                    tbodyText += iconText + '<td>' + pages[i].schedule + '</td></tr>';
                }
                tbodyEl.innerHTML = tbodyText;
            })();
            tableEl.appendChild(tbodyEl);

            // 2.2. 计算背景颜色
            var trEls = tbodyEl.getElementsByTagName('tr'),
                tbth,
                colorTd,
                completenessOpacityNum = 0,
                compatibilityOpacityNum = 0,
                opacityNum,
                blueBar = document.querySelectorAll(".blueBar")[0],
                total = 0;
            tbth = tableEl.querySelectorAll("th");
            for (var i = 0, tbthlen = tbth.length; i < tbthlen; i++) {
                tbth[i].style.width = options.colwidth[i] * 10 + "%";
            }
            (function() {
                for (var i = 0, trElsLen = trEls.length; i < trElsLen; i++) {
                    // 总共4个数据：1280以上宽屏 / 1024屏幕 / 移动端 / 兼容情况，根据实际工作情况，它们的占比分别为 55% 10% 25% 10%
                    // completenessOpacityNum = (pages[i].bigscreen * 0.65 + pages[i].normalscreen * 0.25) / 100;
                    // 兼容度的透明度数值 = 已经兼容的浏览器个数 / 全部需要兼容的浏览器个数
                    // compatibilityOpacityNum = pages[i].compatibility.length / options.compatibility.length * 0.1;
                    // opacityNum = compatibilityOpacityNum;

                    total += pages[i].schedule;
                    opacityNum = pages[i].schedule / 100;

                    colorTd = trEls[i].querySelectorAll('td');
                    if (opacityNum > 0) {
                        trEls[i].className = 'viewable';
                        colorTd[3].textContent = opacityNum * 100 + '%';
                        colorTd[3].style.backgroundColor = 'rgba(0, 124, 250, ' + opacityNum + ')';
                    }
                }
                var totalProcess = parseInt(total / pages.length);
                blueBar.innerHTML = "总进度" + totalProcess + "%";
                blueBar.style.backgroundColor = 'rgba(0, 124, 250, ' + total / pages.length / 100 + ')';
                blueBar.style.width = (total / pages.length / 100) * trEls[0].offsetWidth + "px"
            })();
        }
    });

})();
