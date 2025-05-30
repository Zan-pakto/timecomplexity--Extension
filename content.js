async function getCodeFromEditor() {
  const editor = document.querySelector(".monaco-editor");
  if (!editor) return null;
  return editor.innerText;
}

async function askGemini(code) {
  // Simple heuristic-based time complexity estimation
  const lower = code.toLowerCase();

  // Check for nested loops (very basic)
  const forCount = (code.match(/for\s*\(/g) || []).length;
  const whileCount = (code.match(/while\s*\(/g) || []).length;

  let timeComplexity = "O(1)";

  if (forCount > 1 || whileCount > 1) {
    timeComplexity = "O(n^2)";
  } else if (forCount === 1 || whileCount === 1) {
    timeComplexity = "O(n)";
  }

  // Check for recursion (very basic)
  if (/function\s+\w+\s*\(.*\)\s*{[^}]*\breturn\b[^}]*\b\w+\s*\(/.test(code)) {
    timeComplexity = "O(2^n)";
  }

  // Check for sorting
  if (lower.includes("sort")) {
    timeComplexity = "O(n log n)";
  }

  // Return a simple explanation
  return `Estimated Time Complexity: ${timeComplexity}`;
}

function displayComplexity(result) {
  let box = document.getElementById("gemini-complexity-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "gemini-complexity-box";
    box.style.position = "fixed";
    box.style.top = "100px";
    box.style.right = "50px";
    box.style.zIndex = 9999;
    box.style.background = "#fff";
    box.style.border = "2px solid #2196f3";
    box.style.borderRadius = "14px";
    box.style.fontFamily = "monospace";
    box.style.maxWidth = "360px";
    box.style.boxShadow = "0 8px 32px rgba(33,150,243,0.18)";
    box.style.transition = "box-shadow 0.2s";
    box.style.userSelect = "none";
    box.style.minWidth = "320px";
    box.style.padding = "0";
    box.style.overflow = "hidden";

    // Header
    const header = document.createElement("div");
    header.innerText = "Time Complexity Estimator";
    header.style.background =
      "linear-gradient(90deg, #2196f3 60%, #4caf50 100%)";
    header.style.color = "#fff";
    header.style.padding = "12px 18px";
    header.style.fontWeight = "bold";
    header.style.fontSize = "16px";
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.cursor = "move";
    header.style.borderTopLeftRadius = "12px";
    header.style.borderTopRightRadius = "12px";

    // Close button
    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "22px";
    closeBtn.style.marginLeft = "12px";
    closeBtn.onclick = () => box.remove();
    header.appendChild(closeBtn);

    // Drag logic
    let offsetX,
      offsetY,
      isDragging = false;
    header.onmousedown = function (e) {
      isDragging = true;
      offsetX = e.clientX - box.offsetLeft;
      offsetY = e.clientY - box.offsetTop;
      document.onmousemove = function (e) {
        if (isDragging) {
          box.style.left = e.clientX - offsetX + "px";
          box.style.top = e.clientY - offsetY + "px";
          box.style.right = "";
          box.style.position = "absolute";
        }
      };
      document.onmouseup = function () {
        isDragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };

    box.appendChild(header);
    document.body.appendChild(box);
  } else {
    // Remove previous content except header
    while (box.childNodes.length > 1) box.removeChild(box.lastChild);
  }

  // Main content
  const content = document.createElement("div");
  content.style.padding = "18px 18px 8px 18px";
  content.style.fontSize = "15px";
  content.style.color = "#222";
  content.innerHTML = `
    <div style="margin-bottom:12px;">
      <span style="font-weight:bold;color:#2196f3;">${result.replace(
        "Estimated Time Complexity:",
        "Time Complexity:"
      )}</span>
    </div>
    <div id="complexity-graph-placeholder"></div>
  `;
  box.appendChild(content);

  // Draw the graph below the complexity
  drawGraph(result);
}

function drawGraph(result) {
  // Extract time complexity
  let timeComplexity = "O(n)";
  const match = result.match(/O\([^)]+\)/);
  if (match) {
    timeComplexity = match[0];
  } else {
    const lower = result.toLowerCase();
    if (lower.includes("constant time")) timeComplexity = "O(1)";
    else if (lower.includes("linear time")) timeComplexity = "O(n)";
    else if (lower.includes("quadratic time")) timeComplexity = "O(n^2)";
    else if (lower.includes("logarithmic time")) timeComplexity = "O(log n)";
    else if (lower.includes("n log n")) timeComplexity = "O(n log n)";
  }

  // Remove old graph if exists
  const old = document.getElementById("gemini-complexity-graph");
  if (old) old.remove();

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.id = "gemini-complexity-graph";
  canvas.width = 320;
  canvas.height = 180;
  canvas.style.display = "block";
  canvas.style.margin = "16px auto 0 auto";
  canvas.style.background = "#f5f7fa";
  canvas.style.borderRadius = "8px";
  canvas.style.boxShadow = "0 2px 8px rgba(76,175,80,0.08)";

  const ctx = canvas.getContext("2d");

  // Draw axes
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, 140);
  ctx.lineTo(280, 140); // x-axis
  ctx.moveTo(40, 140);
  ctx.lineTo(40, 30); // y-axis
  ctx.stroke();

  // Draw labels
  ctx.font = "12px monospace";
  ctx.fillStyle = "#333";
  ctx.fillText("n", 275, 155);
  ctx.fillText("Ops", 5, 40);

  // Plot complexity curve
  ctx.save();
  ctx.strokeStyle = "#2196f3";
  ctx.lineWidth = 2.5;
  ctx.beginPath();

  // Generate points for n = 1 to 20
  for (let i = 1; i <= 20; i++) {
    let y;
    switch (timeComplexity) {
      case "O(1)":
        y = 1;
        break;
      case "O(log n)":
        y = Math.log2(i);
        break;
      case "O(n)":
        y = i;
        break;
      case "O(n log n)":
        y = i * Math.log2(i);
        break;
      case "O(n^2)":
        y = (i * i) / 5;
        break;
      case "O(2^n)":
        y = Math.pow(2, i) / 1000;
        break;
      case "O(n!)":
        y = factorial(i) / 10000;
        break;
      default:
        y = i;
    }
    // Normalize y to fit canvas
    y = Math.min(y, 100);
    const px = 40 + (240 / 19) * (i - 1);
    const py = 140 - y * 1;
    if (i === 1) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();

  // Add legend
  ctx.font = "bold 13px monospace";
  ctx.fillStyle = "#2196f3";
  ctx.fillText(timeComplexity, 120, 30);

  // Helper for factorial
  function factorial(n) {
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  document.getElementById("gemini-complexity-box").appendChild(canvas);
}

async function run() {
  const code = await getCodeFromEditor();
  if (!code) return;
  const result = await askGemini(code);
  displayComplexity(result);
}

setTimeout(run, 3000); // Wait for page load
