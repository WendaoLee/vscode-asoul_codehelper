/**
 * 产能原因......这一块代码有点小乱，我日后再改。
 */

var globalDate;
var globalRender;

/**
 * 渲染日历。
 * @param {*} calendarData 从事件监听器中获取的日历数据，它来自于本地资源文件packData。
 */
function getCalendar(calendarData,render) {
    globalRender = render;
    var calendar = echarts.init(document.getElementById("calendar"),null,{renderer:globalRender});
    const vscode = acquireVsCodeApi();

    const kaDay = 86400000;//86,400,000 ms;1day

    let todayTime = new Date().toLocaleDateString("zh");
    let daysCount = new Date().getDay();
    let timeInstance = new Date(todayTime).getTime();
    let calendarStart = new Date(timeInstance - (281 + daysCount) * kaDay).toLocaleDateString("zh");

    let option = {
        calendar: {
            range: [calendarStart, todayTime],
            left: '5%',
            right: '5%',
            splitLine: {
                show: false,
            },
            itemStyle: {
                borderWidth: 2,
                borderColor: null,
                opacity: 0.5
                // color: "#161b22",
            },
            yearLabel: {
                show: false,
                margin: 0
            },
            dayLabel: {
                nameMap: ['', 'Mon', '', 'Wed', '', 'Fri', ''],
                margin: 0,
            }
        },
        tooltip: {

        },
        toolbox: {
            feature: {
                saveAsImage: {
                    name: "calendar"
                }
            }
        },
        visualMap: {
            min: 0,
            max: 2000,
            orient:'horizontal',
            type: "piecewise",
            showLabel:false,
            itemGap:2,
            itemWidth:14,
            left:'80%',
            right:'0%',
            bottom:'15%',
            text:['More','Less'],
            type: "piecewise",
            outOfRange: {
                color: ['#ebedf0']
            },
            pieces: [
                { value: 0, color: '#ebedf0' },
                { gt: 0, lt: 1, color: '#9be9a8' },
                { gt: 1, lt: 3, color: '#40c463' },
                { gt: 3, lt: 8, color: '#30a14e' },
                { gt: 8, color: '#216e39' }
            ],
        },
        series: {
            type: "heatmap",
            name: "233",
            coordinateSystem: "calendar",
            data: getInitialData(calendarData,daysCount),
            tooltip: {
                formatter: (params) => {
                    let hour = ~~params.value[1];
                    let minutes = ((params.value[1] % 1) * 60).toFixed();
                    return `<b>${params.value[0]} </b>
                   </br> You spend ${hour} hours ${minutes} minutes
                   </br> Click to view details`
                }
            }
        },
    };

    calendar.setOption(option);

    calendar.on('click', function (params) {
        if(params.value[1] == 0){
            return;
        }
        if(globalDate == params.value[0]){
            return;
        }
        globalDate = params.value[0];
        vscode.postMessage(params.value[0])
    })

    window.onresize = function () {
        calendar.resize()
    }
}

function showLanguage(dataArgs) {

    let results = processDateData(dataArgs, ["statistic", "language"]);
    let dom = document.getElementById("index-2");

    dom.style.display = "block";
    let content = document.getElementById("languageShow");
    content.style.height = 72 + 44 * results.length + "px";

    var language_charts = echarts.init(document.getElementById("languageShow"), null, { renderer: globalRender });
    language_charts.resize();

    const option_item = {
        title: "Language Used",
        subtitle: ` 在${globalDate}你用了什么语言呢~`,
        datasource: results,
        savedName: `${globalDate}_Language_Used`
    }

    let lan_option = getLinearBarOption(option_item);

    language_charts.setOption(lan_option);
}

function showProject(dataArgs) {
    

    let results = getProjectData(dataArgs);

    let dom = document.getElementById("index-3");

    dom.style.display = "block";
    let content = document.getElementById("projectShow");
    content.style.height = 72 + 44 * results.length + "px";

    var project_charts = echarts.init(content, null, { renderer: globalRender });
    project_charts.resize();

    const option_item = {
        title: "Project Used",
        subtitle: ` 在${globalDate}你在用哪些项目呢？`,
        datasource: results,
        savedName: `${globalDate}_Project_Used`
    }

    let project_option = getLinearBarOption(option_item);


    project_charts.setOption(project_option);
}



/**
 * 处理渲染数据
 * @todo 实现多态
 * @param {*} dateObejct 当日date数据
 * @param [paraent key,child key] parakeys 如获取language的统计数据["statistic","language"]
 * @returns 
 */
function processDateData(dateObejct, parakeys) {
    let index = 0;
    let targetOb = dateObejct;
    while (index < parakeys.length) {
        targetOb = targetOb[parakeys[index]];
        index++;
    }
    let keys = Object.keys(targetOb);
    let values = Object.values(targetOb);

    index = 0;
    let arr = [];
    while (index < keys.length) {
        arr.push([
            keys[index],
            values[index].hours * 60 + values[index].minutes
        ])
        index++;
    }
    return arr;
}

function getProjectData(dataArgs){
    let keys = Object.keys(dataArgs["details"]);
    let arr = [];
    for(let index = 0;index < keys.length;index++){
        arr.push([
                keys[index],
                dataArgs["details"][keys[index]]["statistic"].hours * 60 +dataArgs["details"][keys[index]]["statistic"].minutes
        ])
    }
    return arr;
}

function getLinearBarOption({ title, subtitle, datasource, savedName }) {
    let option = {
        title: {
            text: title,
            subtext: subtitle,
            left: '16px',
            top: '16px'
        },
        grid: {
            bottom: "auto"
        },
        xAxis: {
            type: 'value',
            axisLine: {
                show: false,
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                show: false
            },
            splitLine: {
                show: false
            },
            minorSplitLine: {
                show: false
            },
            splitArea: {
                show: false
            }

        },
        yAxis: {
            type: 'category',
            axisLine: {
                show: false,
            },
            axisTick: {
                show: false
            },
            splitLine: {
                show: false
            },
            minorSplitLine: {
                show: false
            },
            splitArea: {
                show: false
            }
        },
        dataset: {
            source: datasource
        },
        toolbox: {
            feature: {
                saveAsImage: {
                    name: savedName
                }
            }
        },
        series: [
            {
                colorBy: 'data',
                symbol: 'circle',
                type: 'bar',
                showBackground: true,
                backgroundStyle: {
                    color: 'rgba(180, 180, 180, 0.2)'
                },
                barMaxWidth: "18",
                barCategoryGap: "2%",
                itemStyle: {
                    borderRadius: 120,
                    opacity: 2,
                },
                label: {
                    show: true,
                    formatter: function (params) {
                        return `${params.value[1]} minutes`
                    },
                    position: "right"
                }
            }
        ],
        color: ['#FC966E', '#9AC8E2', '#BD7D74','#DB7D74', '#B8A6D9', '#E799B0', '#576690']
    }
    return option;
}

/**
 * 获取日历区域的数据，给不存在数据的区域默认赋值为0
 * @param {*} args 
 * @returns 
 */
function getInitialData(args,daysCount) {
    let today = new Date().toLocaleDateString("zh");
    let timeInstance_ = new Date(today).getTime();


    let day = 281 + daysCount;//daysCount[0,6]
    let arr = [];
    while (day != 0) {
        arr.push([
            new Date(timeInstance_).toLocaleDateString("zh"),
            0
        ]);
        timeInstance_ -= 86400000; //86,400,000 ms;1day
        day--;
    }
    for (let i = 0; i < args.length; i++) {
        arr.push(args[i]);
    }
    return arr;
}