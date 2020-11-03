function openPdf(contents, pages, annotations) {
    var pdfjsLib = window['pdfjs-dist/build/pdf'];
    pages = pages.split(',').map(Number);

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/es5/build/pdf.worker.js';
    var pdfDoc = null,
        pageNum = 1,
        pageRendering = false,
        pageNumPending = null,
        scale = 1,
        canvas = document.getElementById('the-canvas'),
        ctx = canvas.getContext('2d'),
        canvasWidth = canvas.width,
        TEXT_LINE_HEIGHT = 1.2,
        TEXT_FONT_FAMILY = '"Noto Sans", sans-serif',
        TYPE_COLOR_ALPHA = {};

    TYPE_COLOR_ALPHA['PEN'] = 1;
    TYPE_COLOR_ALPHA['HIGHLIGHTER'] = 0.5;
    TYPE_COLOR_ALPHA['TEXT'] = 1;

    if (pages[0] != 0) {
        pageNum = pages[0];
    }

    var pdfData = atob(contents);
    var annotationsData = annotations;
    var loadingTask = pdfjsLib.getDocument({ data: pdfData });
    loadingTask.promise.then(function (pdf) {
        pdfDoc = pdf;
        renderPage(pageNum);
    });

    function renderPage(num) {
        pageRendering = true;
        pdfDoc.getPage(num).then(function (page) {

            var viewport = page.getViewport({ scale: canvasWidth / page.getViewport({ scale: scale }).width });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            var renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            var renderTask = page.render(renderContext);

            renderTask.promise.then(function () {
                pageRendering = false;

                if (pages[0] != 0) {
                    lastPage = pages[pages.length - 1];
                } else {
                    pages = numberRange(1, pdfDoc.numPages);
                    lastPage = pdfDoc.numPages;
                }

                var prevPage = num - 1;
                if (prevPage < pages[0]) {
                    document.getElementById('prev').style.display = 'none';
                } else {
                    document.getElementById('prev').style.display = 'block';
                }
                var nextPage = num + 1;
                if (nextPage > lastPage) {
                    document.getElementById('next').style.display = 'none';
                } else {
                    document.getElementById('next').style.display = 'block';
                }

                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.miterLimit = 10;

                renderAnnotationLines(annotationsData);
                renderAnnotationText(annotationsData);

                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }

            });
        });
    }

    function renderAnnotationLines(annotationsData) {
        var annotationsJson = JSON.parse(annotationsData);
        var annotationItemModels = annotationsJson.find(x => x.Page === pageNum - 1);

        if (annotationItemModels) {
            var annotationsLine = annotationItemModels.Data.filter(isLine);
            if (annotationsLine) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.miterLimit = 10;

                for (var i = 0; i < annotationsLine.length; i++) {
                    annotationsLine[i].Points = annotationsLine[i].points;
                    var points = annotationsLine[i].Points;
                    if (points.length > 0) {
                        var point = points[0];
                        var x = point[0] * canvas.width;
                        var y = point[1] * canvas.height;

                        ctx.beginPath();
                        ctx.moveTo(x, y);

                        var color = annotationsLine[i].color;
                        var size = annotationsLine[i].size;
                        // Make sure we can draw dots from single lines
                        ctx.lineTo(x + 0.01, y + 0.01);

                        for (var index = 1; index < annotationsLine[i].points.length; index++) {
                            var point = annotationsLine[i].points[index];
                            var x = point[0] * canvas.width;
                            var y = point[1] * canvas.height;

                            ctx.lineTo(x, y);
                        }
                        ctx.strokeStyle = "#" + color;
                        ctx.lineWidth = parseFloat(size) * canvas.width;
                        ctx.globalAlpha = TYPE_COLOR_ALPHA[annotationsLine[i].type];

                        ctx.stroke();
                    }
                }
            }
        }
    }

    function renderAnnotationText(annotations) {
        var annotationsJson = JSON.parse(annotations);
        var annotationItemModels = annotationsJson.find(x => x.Page === pageNum - 1);
        if (annotationItemModels) {
            var annotationsText = annotationItemModels.Data.filter(isText);
            for (var i = 0; i < annotationsText.length; i++) {

                var points = annotationsText[i].points;

                if (points.length !== 2) {
                    throw new Error('Text annotation expects 2 points');
                }

                var x1 = points[0][0] * canvas.width;
                var y1 = points[0][1] * canvas.height;
                var x2 = points[1][0] * canvas.width;
                var maxWidth = x2 - x1;

                var size = annotationsText[i].size * canvas.width;
                var offsetTop = y1;
                var text = void 0;
                var textHeight = 0;
                var line = void 0;

                function getNextLine() {

                    text = text.trim();

                    var lines = text.split('\n');
                    var line = lines[0];
                    var lineWidth = ctx.measureText(line).width;

                    if (lineWidth > maxWidth) {
                        while (line.indexOf(' ') > -1 && lineWidth > maxWidth) {
                            line = line.substr(0, line.lastIndexOf(' '));
                            lineWidth = ctx.measureText(line).width;
                        }

                        while (lineWidth > maxWidth && line.length > 1) {
                            line = line.substr(0, line.length - 1);
                            lineWidth = ctx.measureText(line).width;
                        }

                        // update remaining text
                        lines[0] = lines[0].substr(line.length);
                        text = lines.join('\n');
                    } else {
                        // update remaining text
                        lines.shift();
                        text = lines.join('\n');
                    }

                    return line;
                }

                text = annotationsText[i].text;
                line = getNextLine();

                while (typeof line === 'string' && line.length > 0) {
                    textHeight += TEXT_LINE_HEIGHT * size;

                    line = getNextLine();
                }

                ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                ctx.fillRect(x1, y1, x2 - x1, textHeight);

                ctx.globalAlpha = 1;
                ctx.font = size + 'px ' + TEXT_FONT_FAMILY.split(',')[0].trim();
                ctx.fillStyle = '#' + annotationsText[i].color;
                ctx.fontFamily = TEXT_FONT_FAMILY;

                text = annotationsText[i].text;
                line = getNextLine();
                while (typeof line === 'string' && line.length > 0) {
                    ctx.fillText(line, x1, offsetTop + size);
                    offsetTop += TEXT_LINE_HEIGHT * size;
                    line = getNextLine();
                }
            }
        }
    }

    function numberRange(start, end) {
        return new Array(end - start + 1).fill().map((d, i) => i + start);
    }

    function isLine(x) {
        return x.type !== "TEXT";
    }

    function isText(x) {
        return x.type === "TEXT";
    }

    function getNextPage(num) {
        index = pages.indexOf(num);
        if (index >= 0 && index < pages.length - 1) {
            num = pages[index + 1];
        }
        return num;
    }

    function getPrevPage(num) {
        index = pages.indexOf(num);
        if (index > 0 && index < pages.length) {
            num = pages[index - 1];
        }
        return num;
    }

    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }

    function onPrevPage() {
        if (pages[0] != 0) {
            pageNum = getPrevPage(pageNum)
        } else {
            if (pageNum <= 1) {
                return;
            }
            pageNum--;
        }
        queueRenderPage(pageNum);
    }
    document.getElementById('prev').addEventListener('click', onPrevPage);

    function onNextPage() {
        if (pages[0] != 0) {
            pageNum = getNextPage(pageNum)
        } else {
            if (pageNum >= pdfDoc.numPages) {
                return;
            }
            pageNum++;
        }
        queueRenderPage(pageNum);
    }
    document.getElementById('next').addEventListener('click', onNextPage);
}