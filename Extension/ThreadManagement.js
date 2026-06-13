// Name: 线程管理 / Thread Management
// ID: ThreadManagement
// Description: 线程的更多操作，解决内核痛点
// By: 无心小白僵尸 / Wxxbjs
// License: CC0 / CC0
// Scratch-compatible: false
// Extended version: v0.0.0

/* 更新 Tips:
 * - v0.0.0：
     提供以下功能：
     - 维护最低执行顺序
     - 广播并等待的严格立刻执行与严格返回和接收（避免逻辑帧延迟的问题，直接解决了“立刻多角色执行”不存在的问题） 
*/

(function(Scratch){
    "use strict";
    
    const Cast=Scratch.Cast;
    const vm=Scratch.vm;
    const runtime=vm.runtime;
    const renderer=vm.renderer;

    const ExtensionsName="Thread";
    const _stage_="_stage_";
    function toString(value){return Cast.toString(value)};
    function toNumber(value){return Cast.toNumber(value)};
    function compare(value1,value2){return Cast.compare(value1,value2)};

    let undefinedThread=null;//无效线程，用来占位
    let ThreadClass=null;//线程的原类（构造函数）

    //队列类
    class Queue{
        constructor(){
            //重置
            this.clear();
        }
        //清空/重置
        clear(){
            this.queue=[];
            this.set=new Set();
            this.head=0;
        }
        //判断队列中存不存在元素
        has(element){
            return this.set.has(element);
        }
        //获取队列长度
        size(){
            return this.queue.length-this.head;
        }
        //判断队列为不为空
        empty(){
            return this.size()===0;
        }
        //加入元素
        push(element){
            //元素不合法或者存在，舍
            if(element===undefined||this.has(element))return;
            //加入元素
            this.queue.push(element);
            this.set.add(element);
        }
        //出对，同时返回队首
        pop(){
            //为空就返回undefined
            if(this.empty())return undefined;
            //取队首
            const top=this.queue[this.head];
            //防止因为没有删除导致暴露一些不该暴露的东西
            this.queue[this.head]=undefined;
            this.set.delete(top);
            //指针向后走
            ++this.head;
            //如果队列为空，重置
            if(this.empty())this.clear();
            //返回元素
            return top;
        }
        //取队首
        front(){
            //返回元素
            return this.empty()?undefined:this.queue[this.head];
        }
    }

    //给出线程的原类（构造函数）
    function getThreadClass(thread){
        if(ThreadClass===null)ThreadClass=thread.__proto__.constructor;
        return ThreadClass;
    }
    //给出无效线程
    function getUndefinedThread(thread){
        getThreadClass(thread);
        //取其构造函数，创建全新实例
        if(undefinedThread===null)undefinedThread=new ThreadClass();
        //为避免某些调度的干扰，将强制维护一些属性
        undefinedThread.target={id:_stage_};
        undefinedThread.status=ThreadClass.STATUS_DONE;//令线程停止执行（关键）
        undefinedThread.isKilled=true;//内部会用到，标记true就是结束了（关键）
        undefinedThread.stack=[];//抹除堆栈
        undefinedThread.stackFrames=[];//抹除栈帧
        //反正就是尽可能标记失活，但是关键是停止线程，让Scr认为这是一个无效线程，及不执行
        return undefinedThread;//返回
    }

    class ThreadManagementExtensions{
        constructor(){
            this.tailThreadsQueue=new Queue();//最低执行顺序线程队列（这里的定义是：先执行了维护积木的先执行）
        }
        getInfo(){
            return{
                id:ExtensionsName,
                name:"线程扩展",
                color1:"#FFBF00",
                color2:"#E6AC00",
                color3:"#CC9900",
                blocks:[
                    {
                        opcode:"lowestExecutionOrder",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"维护最低执行顺序",
                        arguments:{}
                    },
                    {
                        opcode:"broadcastAndWait",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"广播 [broadcastOption] 并等待（严格接收）",
                        arguments:{},
                        hideFromPalette:true,
                        extensions:["colours_event"],
                    },
                    {
                        blockType:Scratch.BlockType.XML,
                        xml:`
                            <block type="Thread_broadcastAndWait">
                                <value name="broadcastOption">
                                    <shadow type="event_broadcast_menu"></shadow>
                                </value>
                            </block>
                        `
                    },
                    "---",
                    {
                        opcode:"debugLog",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"log [str]",
                        arguments:{
                            str:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:""
                            },
                        }
                    },
                ]
            }
        }
        //最低执行顺序（当前逻辑帧严格最后执行，若有多个线程同时被要求最低执行，则按照先后的需求顺序（原在线程池中的先后执行顺序）进行先后执行，原理是持续丢弃+队列管理）
        lowestExecutionOrder(args,util){
            //当前线程
            const thread=util.thread;
            //处于所有线程中的位置
            const threadIndex=runtime.threads.indexOf(thread);
            //追加线程，会自动去重
            this.tailThreadsQueue.push(thread);
            //如果是当前应该被最低执行的线程，且正好处于线程池倒数的这个位置，弹出，返回
            if(this.tailThreadsQueue.front()===thread&&threadIndex===runtime.threads.length-this.tailThreadsQueue.size())this.tailThreadsQueue.pop();
            //否则，说明还未执行到那个时候，把线程丢到末尾
            else{
                //令当前线程的位置为无效线程
                runtime.threads[threadIndex]=getUndefinedThread(thread);
                //追加到线程池末尾
                runtime.threads.push(thread);
                //暂时搁置
                util.yield();
            }
        }
        broadcastAndWait(args,util){
            const broadcastMessage=toString(args.broadcastOption);
                
            //当前线程
            const thread=util.thread;
            getThreadClass(thread);

            //如果是第一次执行（没广播）
            if(!util.stackFrame.startedThreads){
                //广播 广播线程
                util.stackFrame.startedThreads=util.startHats("event_whenbroadcastreceived",{BROADCAST_OPTION:broadcastMessage});
                //如果没有广播被接收，直接结束
                if(util.stackFrame.startedThreads.length===0)return;

                //手动调整这些广播线程，使计算需求严格

                //处于所有线程中的位置
                const threadIndex=runtime.threads.indexOf(thread);

                //令当前线程的位置为无效线程
                runtime.threads[threadIndex]=getUndefinedThread(thread);

                //删除这些广播
                runtime.threads=runtime.threads.filter(thread=>!util.stackFrame.startedThreads.includes(thread));

                //将收到的广播线程插入到旧线程的后面
                util.stackFrame.startedThreads.forEach((thread,idx)=>runtime.threads.splice((threadIndex+1)+idx,0,thread));

                //将当前线程移至最后一个广播线程的下一个位置
                runtime.threads.splice(threadIndex+1+util.stackFrame.startedThreads.length,0,thread);
            }
            //判断是否有线程还在运行，如果仍然有线程且线程不是停止状态就搁置
            //（其实就是标准广播并等待的逻辑哈。copy了一遍而已）
            if(util.stackFrame.startedThreads.some(thread=>runtime.threads.includes(thread)&&thread.status!==ThreadClass.STATUS_DONE))util.yield();
            //否则正常执行
        }
        debugLog(args,util){
            console.log(toString(args.str));
            console.log([...runtime.threads]);
        }
    }
    Scratch.extensions.register(new ThreadManagementExtensions());
})(Scratch);