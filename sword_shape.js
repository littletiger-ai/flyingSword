// sword_shape.js - 飞剑形状绘制模块

/**
 * 绘制飞剑形状 (矢量绘制，边缘，镂空，荧光)
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} sword 
 */
function drawSwordShape(ctx, sword) {
    ctx.save();
    
    // 设置荧光效果
    ctx.shadowBlur = 10;
    ctx.shadowColor = sword.color;
    ctx.strokeStyle = sword.color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 绘制路径
    ctx.beginPath();
    
    // 剑身参数
    const length = 60;
    const width = 10;
    const tipLength = 15;
    const handleLength = 15;
    const guardWidth = 20;

    // 从剑尖开始绘制 (0, -length/2 - tipLength)
    // 假设中心点在 (0,0)
    
    // 1. 剑尖
    ctx.moveTo(0, -length/2 - tipLength);
    
    // 2. 右侧刃
    ctx.lineTo(width/2, -length/2);
    ctx.lineTo(width/2, length/2);
    
    // 3. 右侧护手
    ctx.lineTo(guardWidth/2, length/2 + 2);
    ctx.lineTo(guardWidth/2, length/2 + 5);
    ctx.lineTo(width/2, length/2 + 5);
    
    // 4. 剑柄
    ctx.lineTo(width/2 - 2, length/2 + 5);
    ctx.lineTo(width/2 - 2, length/2 + 5 + handleLength);
    
    // 5. 剑尾 (可以是平的或圆的，这里简单闭合)
    ctx.lineTo(-(width/2 - 2), length/2 + 5 + handleLength);
    
    // 6. 左侧剑柄
    ctx.lineTo(-(width/2 - 2), length/2 + 5);
    ctx.lineTo(-width/2, length/2 + 5);

    // 7. 左侧护手
    ctx.lineTo(-guardWidth/2, length/2 + 5);
    ctx.lineTo(-guardWidth/2, length/2 + 2);
    ctx.lineTo(-width/2, length/2);

    // 8. 左侧刃
    ctx.lineTo(-width/2, -length/2);
    
    // 回到剑尖
    ctx.closePath();
    
    // 描边 (只绘制边缘，镂空)
    ctx.stroke();

    // 如果需要更强的荧光，可以重绘一次
    // ctx.stroke();

    ctx.restore();
}