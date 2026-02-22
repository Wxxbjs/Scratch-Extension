// Name: 纯原扩展 / ...
// ID: WxxbjsScratchBlocksExtension
// Description: 在原Scratch中也可以使用的“非法”积木，不会破坏纯原项目 / ...
// By: 无心小白僵尸 / Wxxbjs
// License: 比 MIT 更宽松的协议 / A more permissive license than MIT
// Scratch-compatible: true
// Extended version: v0.0.1

/* 更新 Tips:
 * - v0.0.0：
     完成大部分有用的积木与组合
 * - v0.0.1：
     新增矩阵积木的更多承载方式
*/

(function (Scratch) {
    "use strict";

    function XMLtoBlock(xml,pd=false) {
        const obj={ blockType: Scratch.BlockType.XML, xml };
        if(pd)obj.filter=[Scratch.TargetType.SPRITE];
        return obj;
    };

    //为了避免重名，直接将名字缩写写进扩展
    class WxxbjsScratchBlocksExtension {
        getInfo() {
            return {
                id: "WxxbjsScratchBlocksExtension",
                name: "纯原扩展",
                color1: "#ffab19",
                color2: "#cf8b17",
                docsURI: "https://en.scratch-wiki.info/wiki/Hidden_Blocks#Events",
                blocks: [
                    // #region --------------- 运动 --------------- 
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "运动"
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "选中了舞台：不可使用运动类积木",
                        filter:[Scratch.TargetType.STAGE]
                    },
                    //对象菜单移除
                    XMLtoBlock(`
                            <block type="motion_goto">
                                <value name="TO"><shadow type="text"><field name="TEXT"></field></shadow></value>
                            </block>
                            `,true),
                    XMLtoBlock(`
                            <block type="motion_glideto">
                                <value name="SECS"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
                                <value name="TO"><shadow type="text"><field name="TEXT"></field></shadow></value>
                            </block>
                            `,true),
                    XMLtoBlock(`
                            <block type="motion_pointtowards">
                                <value name="TOWARDS"><shadow type="text"><field name="TEXT"></field></shadow></value>
                            </block>
                            `,true),
                    "---",
                    // xy坐标同时增加（全）
                    XMLtoBlock(`
                            <block type="motion_gotoxy">
                                <value name="X">
                                    <block type="operator_add">
                                        <value name="NUM1"><shadow type="motion_xposition"/></value>
                                    </block>
                                </value>
                                <value name="Y">
                                    <block type="operator_add">
                                        <value name="NUM1"><shadow type="motion_yposition"/></value>
                                    </block>
                                </value>
                            </block>
                            `,true),
                    // xy坐标同时增加（只要值）
                    XMLtoBlock(`
                            <block type="motion_gotoxy">
                                <value name="X">
                                    <shadow type="operator_add">
                                        <value name="NUM1"><shadow type="motion_xposition"/></value>
                                        <value name="NUM2"><shadow type="math_number"><field name="NUM"></field></shadow></value>
                                    </shadow>
                                </value>
                                <value name="Y">
                                    <shadow type="operator_add">
                                        <value name="NUM1"><shadow type="motion_yposition"/></value>
                                        <value name="NUM2"><shadow type="math_number"><field name="NUM"></field></shadow></value>
                                    </shadow>
                                </value>
                            </block>
                            `,true),
                    // #region --------------- 外观 --------------- 
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "外观"
                    },
                    //一个只有在舞台里才有的积木
                    XMLtoBlock(`
                            <block type="looks_switchbackdroptoandwait">
                                <value name="BACKDROP"><shadow type="looks_backdrops"/></value>
                            </block>
                            `),
                    "---",
                    //特殊造型
                    XMLtoBlock(`
                            <block type="looks_switchcostumeto">
                                <value name="COSTUME"><shadow type="looks_costume"><field name="COSTUME">previous costume</field></shadow></value>
                            </block>
                            `,true),
                    "---",
                    //造型编号判断
                    XMLtoBlock(`
                            <block type="operator_equals">
                                <value name="OPERAND1"><shadow type="looks_costumenumbername"><field name="NUMBER_NAME">number</field></shadow></value>
                                <value name="OPERAND2"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
                            </block>
                            `,true),
                    //背景编号判断
                    XMLtoBlock(`
                            <block type="operator_equals">
                                <value name="OPERAND1"><shadow type="looks_backdropnumbername"><field name="NUMBER_NAME">number</field></shadow></value>
                                <value name="OPERAND2"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
                            </block>
                            `),
                    //造型名称判断
                    XMLtoBlock(`
                            <block type="operator_equals">
                                <value name="OPERAND1"><shadow type="looks_costumenumbername"><field name="NUMBER_NAME">name</field></shadow></value>
                                <value name="OPERAND2"><shadow type="looks_costume"/></value>
                            </block>
                            `,true),
                    //背景名称判断
                    XMLtoBlock(`
                            <block type="operator_equals">
                                <value name="OPERAND1"><shadow type="looks_backdropnumbername"><field name="NUMBER_NAME">name</field></shadow></value>
                                <value name="OPERAND2"><shadow type="looks_backdrops"/></value>
                            </block>
                            `),
                    "---",
                    //对象菜单移除
                    XMLtoBlock(`
                            <block type="looks_switchcostumeto">
                                <value name="COSTUME"><shadow type="text"><field name="TEXT"></field></shadow></value>
                            </block>
                            `,true),
                    XMLtoBlock(`
                            <block type="looks_switchbackdropto">
                                <value name="BACKDROP"><shadow type="text"><field name="TEXT"></field></shadow></value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="looks_switchbackdroptoandwait">
                                <value name="BACKDROP"><shadow type="text"><field name="TEXT"></field></shadow></value>
                            </block>
                            `),
                    // #region --------------- 声音 --------------- 
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "声音"
                    },
                    //对象菜单移除
                    XMLtoBlock(`
                            <block type="sound_playuntildone">
                                <value name="SOUND_MENU"><shadow type="text"><field name="TEXT"></field></shadow></value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="sound_play">
                                <value name="SOUND_MENU"><shadow type="text"><field name="TEXT"></field></shadow></value>
                            </block>
                            `),
                    // #region --------------- 事件 --------------- 
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "事件"
                    },
                    // 碰到对象头积木（更通用的积木）
                    XMLtoBlock(`
                            <block type="event_whentouchingobject">
                                <value name="TOUCHINGOBJECTMENU">
                                    <shadow type="sensing_touchingobjectmenu"/>
                                </value>
                            </block>
                            `),
                    // 碰到对象头积木（原始块）
                    XMLtoBlock(`
                            <block type="event_whentouchingobject">
                                <value name="TOUCHINGOBJECTMENU">
                                    <shadow type="event_touchingobjectmenu"/>
                                </value>
                            </block>
                            `),
                    "---",
                    // 当<>为真（严谨版）
                    XMLtoBlock(`
                            <block type="event_whengreaterthan">
                                <field name="WHENGREATERTHANMENU">TIMER</field>
                                <value name="VALUE">
                                    <block type="operator_subtract">
                                        <value name="NUM1">
                                            <shadow type="operator_add">
                                                <value name="NUM1"><shadow type="sensing_timer"/></value>
                                                <value name="NUM2"><shadow type="math_number"><field name="NUM">0.5</field></shadow></value>
                                            </shadow>
                                        </value>
                                    </block>
                                </value>
                            </block>
                            `),
                    // 当<>为真（不严谨版）
                    XMLtoBlock(`
                            <block type="event_whengreaterthan">
                                <field name="WHENGREATERTHANMENU">TIMER</field>
                                <value name="VALUE">
                                    <block type="operator_subtract">
                                        <value name="NUM1"><shadow type="sensing_timer"/></value>
                                    </block>
                                </value>
                            </block>
                            `),
                    //对象菜单移除
                    "---",
                    XMLtoBlock(`
                            <block type="event_broadcast">
                                <value name="BROADCAST_INPUT"><shadow type="text"><field name="TEXT"></field></shadow></value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="event_broadcastandwait">
                                <value name="BROADCAST_INPUT"><shadow type="text"><field name="TEXT"></field></shadow></value>
                            </block>
                            `),
                    // #region --------------- 控制 --------------- 
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "控制"
                    },
                    // [对于()中的每一个[]]，for语句
                    XMLtoBlock(`
                            <block id="for_each" type="control_for_each">
                                <value name="VALUE">
                                    <shadow type="math_whole_number">
                                        <field name="NUM">10</field>
                                    </shadow>
                                </value>
                            </block>
                            `),
                    // [当<>重复执行]，while语句
                    XMLtoBlock(`
                            <block id="while" type="control_while"/>
                            `),
                    "---",
                    //获取计数器
                    XMLtoBlock(`
                            <block type="control_get_counter"/>
                            `),
                    //计数器增加
                    XMLtoBlock(`
                            <block type="control_incr_counter"/>
                            `),
                    //计数器清空
                    XMLtoBlock(`
                            <block type="control_clear_counter"/>
                            `),
                    "---",
                    //断点积木，解决无尾积木的连接问题和手动实现浪费的不必要时间
                    XMLtoBlock(`
                            <block type="control_if">
                                <value name="CONDITION"><shadow type="operator_not"/></value>
                                <value name="SUBSTACK"><shadow type="control_stop"><field name="STOP_OPTION">this script</field></shadow></value>
                            </block>
                            `),
                    "---",
                    //对象菜单移除
                    XMLtoBlock(`
                            <block type="control_create_clone_of">
                                <value name="CLONE_OPTION"><shadow type="text"><field name="TEXT"></field></shadow></value>
                            </block>
                            `),
                    // #region --------------- 侦测 --------------- 
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "侦测"
                    },
                    //响声?
                    XMLtoBlock(`
                            <block type="sensing_loud"/>
                            `),
                    //用户ID
                    XMLtoBlock(`
                            <block type="sensing_userid"/>
                            `),
                    "---",
                    //判断角色存不存在，因为operator_gt的一些离谱行为，导致不能在积木区锁定内联字符串输入框，，挺难受的。
                    XMLtoBlock(`
                            <block type="operator_gt">
                                <value name="OPERAND1">
                                    <block type="sensing_of">
                                        <value name="OBJECT">
                                            <block type="text"><field name="TEXT"></field></block>
                                            <shadow type="sensing_of_object_menu"/>
                                        </value>
                                        <field name="PROPERTY">costume #</field>
                                    </block>
                                </value>
                                <value name="OPERAND2"><shadow type="math_number"><field name="NUM">0</field></shadow></value>
                            </block>
                            `),
                    //获取今天的星期，不是索引，是准确的数字
                    XMLtoBlock(`
                            <block type="operator_add">
                                <value name="NUM1">
                                    <shadow type="operator_mod">
                                        <value name="NUM1">
                                            <shadow type="operator_subtract">
                                                <value name="NUM1">
                                                    <shadow type="sensing_current">
                                                        <field name="CURRENTMENU">DAYOFWEEK</field>
                                                    </shadow>
                                                </value>
                                                <value name="NUM2"><shadow type="math_number"><field name="NUM">2</field></shadow></value>
                                            </shadow>
                                        </value>
                                        <value name="NUM2"><shadow type="math_number"><field name="NUM">7</field></shadow></value>
                                    </shadow>
                                </value>
                                <value name="NUM2"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
                            </block>
                            `),
                    //获取2000年至今的秒数，自动四舍五入
                    XMLtoBlock(`
                            <block type="operator_divide">
                                <value name="NUM1">
                                    <shadow type="operator_round">
                                        <value name="NUM">
                                            <shadow type="operator_multiply">
                                                <value name="NUM1"><shadow type="sensing_dayssince2000"/></value>
                                                <value name="NUM2"><shadow type="math_number"><field name="NUM">864000</field></shadow></value>
                                            </shadow>
                                        </value>
                                    </shadow>
                                </value>
                                <value name="NUM2"><shadow type="math_number"><field name="NUM">1000</field></shadow></value>
                            </block>
                            `),
                    "---",
                    //对象菜单移除
                    XMLtoBlock(`
                            <block type="sensing_touchingobject">
                                <value name="TOUCHINGOBJECTMENU"><shadow type="text"><field name="TEXT"></field></shadow></value>
                            </block>
                            `,true),
                    XMLtoBlock(`
                            <block type="sensing_distanceto">
                                <value name="DISTANCETOMENU"><shadow type="text"><field name="TEXT"></field></shadow></value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="sensing_keypressed">
                                <value name="KEY_OPTION"><shadow type="text"><field name="TEXT"></field></shadow></value>
                            </block>
                            `),
                    // #region --------------- 运算 --------------- 
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "运算"
                    },
                    //加法
                    XMLtoBlock(`
                            <block type="operator_add">
                                <value name="NUM2"><shadow type="math_number"><field name="NUM"></field></shadow></value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_add">
                                <value name="NUM1"><shadow type="math_number"><field name="NUM"></field></shadow></value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_add">
                            </block>
                            `),
                    //减法
                    XMLtoBlock(`
                            <block type="operator_subtract">
                                <value name="NUM2"><shadow type="math_number"><field name="NUM"></field></shadow></value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_subtract">
                                <value name="NUM1"><shadow type="math_number"><field name="NUM"></field></shadow></value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_subtract">
                            </block>
                            `),
                    //幂
                    XMLtoBlock(`
                            <block type="operator_mathop">
                                <field name="OPERATOR">e ^</field>
                                <value name="NUM">
                                    <block type="operator_multiply">
                                        <value name="NUM1">
                                            <block type="operator_mathop">
                                                <field name="OPERATOR">ln</field>
                                                <value name="NUM"><shadow type="math_number"><field name="NUM">2</field></shadow></value>
                                            </block>
                                        </value>
                                        <value name="NUM2"><shadow type="math_number"><field name="NUM">0.5</field></shadow></value>
                                    </block>
                                    <shadow type="math_number"><field name="NUM"></field></shadow>
                                </value>
                            </block>
                            `),
                    // #region --------------- 自制积木 --------------- 
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "自制积木"
                    },
                    //布尔参数对象
                    XMLtoBlock(`
                            <block type="argument_editor_boolean"><field name="TEXT"></field></block>
                            `),
                    //字符串和数字参数对象
                    XMLtoBlock(`
                            <block type="argument_editor_string_number"><field name="TEXT"></field></block>
                            `),
                    //文本对象
                    XMLtoBlock(`
                            <block type="procedures_declaration"><mutation proccode="积木名称"/></block>
                            `),
                    // #region --------------- 输入框 --------------- 
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "输入框（部分不能单独出现）"
                    },
                    //数字
                    XMLtoBlock(`
                            <block type="math_number"><field name="NUM">0</field></block>
                            `),
                    //非负整数
                    XMLtoBlock(`
                            <block type="math_whole_number"><field name="NUM">0</field></block>
                            `),
                    //字符串
                    XMLtoBlock(`
                            <block type="text"><field name="TEXT"></field></block>
                            `),
                    //角度，由于单独出现会粘手，所以用运算积木承载一下
                    XMLtoBlock(`
                            <block type="operator_add">
                                <value name="NUM1"><shadow type="math_angle"><field name="NUM">90</field></shadow></value>
                                <value name="NUM2"><shadow type="math_number"><field name="NUM"></field></shadow></value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_add">
                                <value name="NUM1"><shadow type="math_number"><field name="NUM"></field></shadow></value>
                                <value name="NUM2"><shadow type="math_angle"><field name="NUM">90</field></shadow></value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_subtract">
                                <value name="NUM1"><shadow type="math_angle"><field name="NUM">90</field></shadow></value>
                                <value name="NUM2"><shadow type="math_number"><field name="NUM"></field></shadow></value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_subtract">
                                <value name="NUM1"><shadow type="math_number"><field name="NUM"></field></shadow></value>
                                <value name="NUM2"><shadow type="math_angle"><field name="NUM">90</field></shadow></value>
                            </block>
                            `),
                    //音符，由于单独出现会粘手，所以用四舍五入积木承载一下
                    XMLtoBlock(`
                            <block type="operator_round">
                                <value name="NUM">
                                    <shadow type="note">
                                        <field name="NOTE">60</field>
                                    </shadow>
                                </value>
                            </block>
                            `),
                    //颜色输入框，由于单独出现会粘手，所以用连接积木承载一下
                    XMLtoBlock(`
                            <block type="operator_join">
                                <value name="STRING1">
                                    <shadow type="colour_picker"/>
                                </value>
                                <value name="STRING2">
                                    <shadow type="text">
                                        <field name="TEXT"></field>
                                    </shadow>
                                </value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_join">
                                <value name="STRING1">
                                    <shadow type="text">
                                        <field name="TEXT"></field>
                                    </shadow>
                                </value>
                                <value name="STRING2">
                                    <shadow type="colour_picker"/>
                                </value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_join">
                                <value name="STRING1">
                                    <shadow type="colour_picker"/>
                                </value>
                                <value name="STRING2">
                                    <shadow type="colour_picker"/>
                                </value>
                            </block>
                            `),
                    //5×5的矩阵，返回若干01值
                    XMLtoBlock(`
                            <block type="matrix">
                                <field name="MATRIX">0111010000011000001011100</field>
                            </block>
                            `),
                    //字符串内联
                    XMLtoBlock(`
                            <block type="operator_join">
                                <value name="STRING1">
                                    <shadow type="matrix">
                                        <field name="MATRIX">0111010000100001000001110</field>
                                    </shadow>
                                </value>
                                <value name="STRING2">
                                    <shadow type="text">
                                        <field name="TEXT"></field>
                                    </shadow>
                                </value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_join">
                                <value name="STRING1">
                                    <shadow type="text">
                                        <field name="TEXT"></field>
                                    </shadow>
                                </value>
                                <value name="STRING2">
                                    <shadow type="matrix">
                                        <field name="MATRIX">1110010010111001010010010</field>
                                    </shadow>
                                </value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_join">
                                <value name="STRING1">
                                    <shadow type="matrix">
                                        <field name="MATRIX">1111110101001000010001110</field>
                                    </shadow>
                                </value>
                                <value name="STRING2">
                                    <shadow type="matrix">
                                        <field name="MATRIX">1010110101101010101001010</field>
                                    </shadow>
                                </value>
                            </block>
                            `),
                    //运算积木承载
                    XMLtoBlock(`
                            <block type="operator_add">
                                <value name="NUM1">
                                    <shadow type="matrix">
                                        <field name="MATRIX">0100011000010000100011100</field>
                                    </shadow>
                                </value>
                                <value name="NUM2">
                                    <shadow type="math_number">
                                        <field name="NUM"></field>
                                    </shadow>
                                </value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_add">
                                <value name="NUM1">
                                    <shadow type="math_number">
                                        <field name="NUM"></field>
                                    </shadow>
                                </value>
                                <value name="NUM2">
                                    <shadow type="matrix">
                                        <field name="MATRIX">0110010010001000100011110</field>
                                    </shadow>
                                </value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_add">
                                <value name="NUM1">
                                    <shadow type="matrix">
                                        <field name="MATRIX">0110010010001001001001100</field>
                                    </shadow>
                                </value>
                                <value name="NUM2">
                                    <shadow type="matrix">
                                        <field name="MATRIX">1010010100111100010000100</field>
                                    </shadow>
                                </value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_subtract">
                                <value name="NUM1">
                                    <shadow type="matrix">
                                        <field name="MATRIX">1111010000111000001011100</field>
                                    </shadow>
                                </value>
                                <value name="NUM2">
                                    <shadow type="math_number">
                                        <field name="NUM"></field>
                                    </shadow>
                                </value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_subtract">
                                <value name="NUM1">
                                    <shadow type="math_number">
                                        <field name="NUM"></field>
                                    </shadow>
                                </value>
                                <value name="NUM2">
                                    <shadow type="matrix">
                                        <field name="MATRIX">0110010000111001001001100</field>
                                    </shadow>
                                </value>
                            </block>
                            `),
                    XMLtoBlock(`
                            <block type="operator_subtract">
                                <value name="NUM1">
                                    <shadow type="matrix">
                                        <field name="MATRIX">1111000010001000100001000</field>
                                    </shadow>
                                </value>
                                <value name="NUM2">
                                    <shadow type="matrix">
                                        <field name="MATRIX">0110010010011001001001100</field>
                                    </shadow>
                                </value>
                            </block>
                            `),
                    //四舍五入承载
                    XMLtoBlock(`
                            <block type="operator_round">
                                <value name="NUM">
                                    <shadow type="matrix">
                                        <field name="MATRIX">0110010010011100001001100</field>
                                    </shadow>
                                </value>
                            </block>
                            `),
                    // #region --------------- 菜单 --------------- 
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "菜单"
                    },
                    XMLtoBlock(`
                            <block type="event_touchingobjectmenu"></block>
                            `),
                    XMLtoBlock(`
                            <block type="event_broadcast_menu"></block>
                            `),
                ],
            };
        }
    }
    Scratch.extensions.register(new WxxbjsScratchBlocksExtension());
})(Scratch);