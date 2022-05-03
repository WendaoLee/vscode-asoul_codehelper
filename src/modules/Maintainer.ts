/*--------------------------------------------------------------------------------
 * Copyright (C) Wendao Lee (https://github.com/WendaoLee).All rights reserved.
 *--------------------------------------------------------------------------------*/

import {window} from 'vscode'

/**
 * 定义并约束维护器与调用者之间的操作。
 * @method getLocalData():object 获取存储到本地的数据对象。
 * @method updateData(context:string) 调用者操作维护器的接口，维护器将根据调用者传来的语料决定执行的操作。
 */
interface TransferData {
    getLocalData(): object,
    updateData(context: string): void | string
}

/**
 * 维护器，它将主要维护名为localData和maintainedData的对象。
 * localData用于本地数据的存储，它包括当月的所有数据，它只会在调用者使用getLocalData()时才会发生更新。
 * maintainData是当天的统计数据对象，是维护器的主要维护对象。一切从调用者传入的更新信号都只对该对象进行操作
 * @implements TransferData
 * 
 * @member kDateTime 当日日期。采用汉语格式化规则，例如'2022/4/16'
 * @member kProject 当前项目名。
 * 
 * @member nowLanguage 当前使用的编程语言。
 * 
 * @member localData 本地数据。它只在调用者通过接口使用getLocalData()时才会发生更新。
 * @member maintainData 是当天的统计数据。是维护器的主要维护对象。从调用者传入的更新语料都只对该对象进行操作。
 * @member timeUpdater 记录上一次更新的时间，只用于内部数据统计。
 */
export class Maintainer implements TransferData {

    /**
     * 用于指明maintainData所要维护的日期对象。
     * 它不会改变。哪怕过了当日24时，我们依然把之后的统计时间算在前一天内，直到您重启插件。
     * @constant kDateTime 当日日期。采用汉语格式化规则，例如'2022/4/16'
     */
    private kDateTime: string;

    /**
     * 用于指明当前所编写的项目，用于maintainData的细节统计。
     * 它不会发生改变。
     */
    private kProject = "unknown";


    /**
     * 用于指明当前统计时间的所属编程语言，用于maintainData的总共统计与细节统计。
     * 它将在编码文件的语言类型发生改变时改变。
     * @todo Change nowLanguage when language changed。
     * @member nowLanguage 当前所编码文件所属的语言类型。它由@link vscode.window.activeTextEditor?.document.languageId 获取。
     */
    private nowLanguage = "unknown";

    /**
     * 维护的本地数据对象。它将存储当月数据对应的文件数据。它只在getLocalData()时才会发生更新。
     * @member localData 本地数据。它只在调用者通过接口使用getLocalData()时才会发生更新。
     */
    private localData: object = {};

    /**
     * 维护器维护的主要对象，它存储当日的所有统计数据。
     * @member maintainData 是当天的统计数据。是维护器的主要维护对象。从调用者传入的更新语料都只对该对象进行操作。
     * maintainedData的主要结构：
     * @example {
                "statistic": {
                    "hours": 0,
                    "minutes": 0,
                    "seconds": 0,
                    "language":{
                        "null":{
                            "hours":0,
                            "minutes":0,
                            "seconds":0,
                            "time_period":[]
                        }
                    }
                },
                "details": {
                    "projectname":{
                        "timeperiod":[],
                        "statistic":{
                            "hours":0,
                            "minutes":0,
                            "seconds":0,
                            "language":{
                                "null":{
                                    "hours":0,
                                    "minutes":0,
                                    "seconds":0,
                                    "time_period":[]
                                }
                            }
                        }
                    }
                }
            }
     * 
     */
    private maintainedData: object = {};


    /**
     * 记录上一次更新时间。它仅用于内部的数据统计。
     * @todo 当多开窗口时，暂停当前项目的时间统计。
     * @member timeUpdater 记录上一次更新的时间，只用于内部数据统计。
     */
    private timeUpdater: number;

    private updateLock:boolean;


    /**
     * 获取存储到本地的数据对象。它由接口@TransferData 定义
     * @returns this.localData:object
     */
    getLocalData(): object {
        return this.updateLocalData();
    }

    /**
     * 更新维护的当日统计数据对象@maintainedData ，并根据传入的context返回特定的数据。
     * @param context 可选的值有'periodic'|| ''
     * @function periodic
     */
    updateData(context: string): void | string {
        let that = this;
        const command = {
            "periodic": function () {
                return that.periodicUpdate()
            },
            "caculateTime": function () {
                return that.caculateTime()
            },
            "changedLanguage":function(){
                return that.onLanguageChanged()
            }
        }
        return command[context]();
    }

    /**
     * 初始化维护器。它将主要维护名为localData和maintainedData的对象。
     * localData用于本地数据的存储，它包括当月的所有数据，它只会在调用者使用getLocalData()时才会发生更新。
     * maintainData是当天的统计数据对象，是维护器的主要维护对象。一切从调用者传入的更新信号都只对该对象进行操作。
     * @param context 包括language和project，指示使用的编程语言和项目名称，用于细节统计。
     * @param localdata 本地数据。如果本地数据没有当日数据，则会自动生成与之相关的maintainData实例。
     */
    constructor(context: object, localdata?: object) {
        let date = new Date();
        this.timeUpdater = date.getTime();
        this.kDateTime = date.toLocaleDateString('zh');

        this.updateLock = true;

        this.initialContext(context);
        this.initialData(context, localdata);
    }


    /**
     * 指明当前使用语言和项目名。
     * @param context 包括language和project，指示使用的编程语言和项目名称，主要用于细节统计。
     */
    private initialContext(context: object) {
        this.nowLanguage = context["language"];
        this.kProject = context["projectname"];
    }

    /**
     * 初始化maintainedData与localData。
     * 必须初始化必要的计算键，否则在后面的计算操作中会因为不存在该键而出错。
     * @todo 精简代码。现在好丑且屎。
     * 
     * maintainedData的树形结构即为localData中[Date]以下的结构，即localData本质是由无数个maintainedData([date])子对象组成的对象。
     * localData的树形结构为：
     * @example
     * - Date 
     * -- statistic //时间总计
     * --- hours/minutes/seconds //具体的时间数据项
     * --- language //语言时间统计
     * ---- language-object
     * ----- language-object-details + timeperiod //同上“具体的时间数据项” + timeperiod:[]
     * -- details //细节时间
     * --- project-object //以project名字确定的一个对象
     * ---- timeperiod[]
     * ---- statistic //之后同上
     * ----- hours/minutes/seconds
     * ----- language
     * 
     */
    private initialData(context: object, localData?: object) {
        if (localData == undefined) {
            this.localData = this.getDateTemplateIfUnderfined(this.kDateTime, context);
            this.maintainedData = this.localData[this.kDateTime];
            return;
        }
        if (localData[this.kDateTime] == undefined) {
            this.localData = localData;
            this.maintainedData = this.getDateTemplateIfUnderfined(this.kDateTime, context)[this.kDateTime];
            this.localData[this.kDateTime] = this.maintainedData
            return;
        }
        /**
         * @condition 存在当日存储对象，但是新开了另一个项目。
         */
        if (localData[this.kDateTime]["details"][this.kProject] == undefined) {
            this.localData = localData;
            this.maintainedData = localData[this.kDateTime];

            this.maintainedData["details"][this.kProject] = this.getDetailsTemplateIfUnderfined(this.nowLanguage);

            this.maintainedData["statistic"]["language"][this.nowLanguage] == undefined
                ? this.maintainedData["statistic"]["language"][this.nowLanguage] =
                this.pureObjectReference(this.maintainedData["details"][this.kProject]["statistic"]["language"][this.nowLanguage])
                : null;
            return;
        }
        /**
         * @condition 存在当日存储对象，但是使用新的语言编写。
         */
        if (localData[this.kDateTime]["statistic"]["language"][this.nowLanguage] == undefined) {
            this.localData = localData;
            this.maintainedData = localData[this.kDateTime];

            this.maintainedData["details"][this.kProject]["statistic"]["language"][this.nowLanguage] =
                this.getDetailsTemplateIfUnderfined(this.nowLanguage)["statistic"]["language"][this.nowLanguage];

            this.maintainedData["statistic"]["language"][this.nowLanguage] = 
            this.pureObjectReference(this.maintainedData["details"][this.kProject]["statistic"]["language"][this.nowLanguage])
            return;
        }
        this.localData = localData;
        this.maintainedData = localData[this.kDateTime];
    }

    /** 
     * 返回包含了当前项目以及使用语言的当日Date对象。
     * @param t 当前日期。
     * @param context 包括language和project，指示使用的编程语言和项目名称，主要用于细节统计。
     * @returns 
     */
    private getDateTemplateIfUnderfined = (t: string, context: object) => {
        return JSON.parse(`{
            "${t}":{
                "statistic": {
                    "hours": 0,
                    "minutes": 0,
                    "seconds": 0,
                    "language":{
                        "${context["language"]}":{
                            "hours": 0,
                            "minutes": 0,
                            "seconds": 0,
                            "time_period": []
                        }
                    }
                },
                "details": {
                    "${context["projectname"]}": {
                        "timeperiod": [],
                        "statistic": {
                            "hours": 0,
                            "minutes": 0,
                            "seconds": 0,
                            "language": {
                                "${context["language"]}": {
                                    "hours": 0,
                                    "minutes": 0,
                                    "seconds": 0,
                                    "time_period": []
                                }
                            }
                        }
                    }
                }
            }           
        }`);
    }

    /**
     * 提供details对象的键值项。详情请见initialData()相关注释。
     * @param language 当前使用的语言。
     * @returns 
     */
    private getDetailsTemplateIfUnderfined(language: string) {
        return JSON.parse(`{
            "timeperiod":[],
            "statistic":{
                "hours":0,
                "minutes":0,
                "seconds":0,
                "language":{
                    "${language}":{
                        "hours":0,
                        "minutes":0,
                        "seconds":0,
                        "time_period":[]
                    }
                }
            }
        }`)
    }

    /**
     * 周期更新。保存时间并更新maintainedData后，返回指明当前用时的字符串。
     * @returns "xx hs xx mins"
     */
    private periodicUpdate() {
        if(this.updateLock){
            this.updateLock = false;
            this.savePassedTime();
            this.updateLock = true;
        }
        return this.maintainedData["statistic"].hours + " hs " + this.maintainedData["statistic"].minutes + " mins ";
    }

    /**
     * 返回当日所用的时间，统一以小时数计，精确到小数点后六位。
     * @todo 也许会在未来找到更好地展示Webview日历的方法时废弃
     * @returns 小时数，取小数点后六位
     */
    private caculateTime() {
        if(this.updateLock){
            this.updateLock = false;
            this.savePassedTime();
            this.updateLock = true;
        }
        return Number.parseFloat(
            this.maintainedData["statistic"].hours +
            ((this.maintainedData["statistic"].minutes + this.maintainedData["statistic"].seconds / 60) / 60).toFixed(6)
        )
    }

    /**
     * 更新maintainedData与timeUpdater。
     */
    private savePassedTime() {
        let newUpdater = new Date().getTime();
        let time = newUpdater - this.timeUpdater;
        this.timeUpdater = newUpdater;
        this.updateMaintainedData(this.getPassedTime(time));
    }

    /**
     * 获取经过的时间，用自然语言的xx小时xx分xx秒描述。
     * @param passedMilliSeconds 经过的毫秒数。
     * @returns object
     */
    private getPassedTime(passedMilliSeconds: number): object {
        return {
            "seconds": ~~(passedMilliSeconds / 1000) % 60,
            "minutes": ~~((passedMilliSeconds / 1000) / 60) % 60,
            "hours": ~~((passedMilliSeconds / 1000) / 60 / 60) % 60
        }
    }

    /**
     * 保存并更新maintainedData后，更新localData。
     * @returns localData
     */
    private updateLocalData(): object {
        if(this.updateLock){
            console.log("saving data")
            this.updateLock = false;
            this.savePassedTime();
            this.updateLock = true;
        }
        this.localData[this.kDateTime] = this.maintainedData;
        return this.localData;
    }

    /**
     * 保存并更新maintainedData后，更新当前使用语言。
     * 由于语言切换对应的事件为独立线程。为了避免数据更新时发生的污染，要先进行加锁。
     * @todo 精简代码。
     */
    private onLanguageChanged(){
        if(this.updateLock){
            console.log("here,language changed,and the former lan is :"+this.nowLanguage)
            this.updateLock = false;
            this.savePassedTime();
            this.changeLanguage();
            this.updateLock = true;
            return;
        }else{
            setTimeout(()=>{
                console.log("Update later because the updateLock");
                this.onLanguageChanged();
            },1000)
        }
    }

    /**
     * 改变当前进行记录的语言。
     */
    private changeLanguage(){
        let text = window.activeTextEditor?.document.languageId;
        if(text == undefined){
            return;
        }

        this.nowLanguage = text;
        console.log("now is:"+this.nowLanguage);

        if(!this.existKeyInObject(this.maintainedData["statistic"]["language"],this.nowLanguage)){
            console.log("yes not exist")
            this.maintainedData["details"][this.kProject]["statistic"]["language"][this.nowLanguage] =
                this.getDetailsTemplateIfUnderfined(this.nowLanguage)["statistic"]["language"][this.nowLanguage];

            this.maintainedData["statistic"]["language"][this.nowLanguage] = 
            this.maintainedData["details"][this.kProject]["statistic"]["language"][this.nowLanguage];      
        }
    }

    /**
     * 更新维护数据。
     * @param incre 增加的时间。
     * 
     * @todo 重启correctObject等函数。以简洁的方式更新maintainedData:先增加时间到数据项上，后进行位制的矫正。
     * @todo 由于对象的引用传递，为了代码的稳健性，应考虑采用值传递。
     */
    private updateMaintainedData(incre: object) {
        let keys = ["seconds", "minutes", "hours"]


        this.maintainedData["statistic"] = this.addObjectConstantsNum(
            this.pureObjectReference(this.maintainedData["statistic"]), incre, keys
        );

        this.maintainedData["details"][this.kProject]["statistic"] = this.addObjectConstantsNum(
            this.pureObjectReference(this.maintainedData["details"][this.kProject]["statistic"]), incre, keys
        );


        this.maintainedData["statistic"]["language"][this.nowLanguage] = this.addObjectConstantsNum(
            this.pureObjectReference(this.maintainedData["statistic"]["language"][this.nowLanguage]), incre, keys
        );

        this.maintainedData["details"][this.kProject]["statistic"]["language"][this.nowLanguage] = this.addObjectConstantsNum(
           this.pureObjectReference(this.maintainedData["details"][this.kProject]["statistic"]["language"][this.nowLanguage]),incre, keys
        )

        
    }

    /**
     * 将传入对象指定键值（需要是Number）进行加法操作。
     * @warning 目前这只是一个用于统计时间相加的函数。采用通常时间的60进制。key应该按照低位到高位的顺序进行排序。
     * @deprecated 未来考虑废弃的方法。计划通过迭代来精简该写法。现在为了赶进度暂时搁置。
     * @todo 优化addCorrect方法后取代该方法。
     * @param ob 传入对象。
     * @param increment  增量对象。它将与传入对象的对应键值进行相加操作。
     * @param keys 指定相加值的键。
     * @returns 已完成键值增加的对象。
     */
    private addObjectConstantsNum(ob: object, increment: object, keys: Array<string>): any {
        let digit = 0;
        for (let index = 0; index < keys.length; index++) {
            if (digit != 0) {
                ob[keys[index]] += digit;
                digit = 0;
            }

            (ob[keys[index]] += increment[keys[index]]) >= 60
                ? (digit += ~~(ob[keys[index]] / 60)) && (ob[keys[index]] %= 60)
                : ob[keys[index]];
        }
        return ob;
    }

    private detectMaintained(){
        console.log("\n" + new Date().toISOString())
        let statisticLan = this.maintainedData["statistic"]["language"]
        for(const i in statisticLan){
            console.log(i + ":" + statisticLan[i].hours + " hours " + statisticLan[i].minutes + " minutes " + statisticLan[i].seconds + " seconds ")
        }
        statisticLan = this.maintainedData["statistic"];
        console.log("statistic :" + statisticLan.hours + " hours " + statisticLan.minutes + " minutes " + statisticLan.seconds + " seconds")
    }

    /**
     * 遍历传入的对象，将指定键值进行相加。
     * @param ob 传入对象。
     * @param increment 对应键的增值。
     * @param keys 进行操作的键。
     * @returns 完成相加后的对象
     */
    private addIncrement(ob: object, increment: object, keys: Array<string>) {
        for (const i in ob) {
            keys.indexOf(i) != -1 ? ob[i] += increment[i] : ob[i] = this.addIncrement(ob[i], increment, keys);
            continue;
        }
        return ob;
    }

    /**
     * 遍历对象，检查对应键值是否超过进制阈值。如果超过，则进行矫正，将对应进位加到对应位键上。
     * 为了减少不必要的内存开销，不设进制量参数。
     * @param ob 传入的对象。
     * @param keys 指定键。要求对应的进制位从小到大排序
     * @returns 完成矫正后的对象。
     */
    private correctObject(ob: object, keys: Array<string>) {
        for (const i in ob) {
            keys.indexOf(i) != -1 ? null : ob[i] = this.correctObject(ob[i], keys);
            continue;
        }
        for (let index = 0; index < keys.length - 1; index++) {
            ob[keys[index]] >= 60
                ? (ob[keys[index + 1]] += ~~(ob[keys[index]] / 60)) && (ob[keys[index]] %= 60)
                : null;
            continue;
        }
        return ob;
    }

    /**
     * 检查传入对象的指定键是否超过进制阈值。如果超过，则进行矫正，将对应进位加到对应位键上。
     * 为了减少不必要的内存开销，不设进制量参数。
     * @deprecated 不再被correctObject调用，因为没必要为了看不到的可读性而损失性能。
     * @param ob 传入的对象。
     * @param keys 指定键。要求对应的进制位从小到大排序
     * @returns 完成矫正后的对象。
     */
    private correctData(ob: object, keys: Array<string>) {
        for (let index = 0; index < keys.length - 1; index++) {
            ob[keys[index]] >= 60
                ? (ob[keys[index + 1]] += ~~(ob[keys[index]] / 60)) && (ob[keys[index]] %= 60)
                : null;
            continue;
        }
        return ob;
    }

    /**
     * 判断对象中是否存在该键
     * @param ob 对象
     * @param key 键
     * @returns 
     */
    private existKeyInObject(ob:object,key:string){
        for(const i in ob){
            if(i == key){
                return true;
            }else{
                if(this.existKeyInObject(ob[i],key)) {
                    return true;
                }
            }
        }
        return false;
    }

    private pureObjectReference(ob:object){
        return JSON.parse(JSON.stringify(ob));
    }





}