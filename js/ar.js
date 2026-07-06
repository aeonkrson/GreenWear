document.addEventListener("DOMContentLoaded", () => {
  const webcamElement = document.getElementById("webcam");
  const canvasElement = document.getElementById("ar-canvas");
  const canvasCtx = canvasElement.getContext("2d");
  
  const loadingOverlay = document.getElementById("loading-overlay");
  const fallbackUI = document.getElementById("webcam-fallback-ui");
  const retryBtn = document.getElementById("btn-retry-webcam");
  const toggleSkeletonBtn = document.getElementById("btn-toggle-skeleton");
  const mirrorBtn = document.getElementById("btn-mirror");
  const trackingStatusBadge = document.getElementById("tracking-status-badge");
  
  let activeProduct = PRODUCTS[0];
  let showSkeleton = false;
  let isMirrored = true;
  let trackingActive = false;
  let activeStream = null;
  
  // Pre-load garment overlay images for instant rendering
  const garmentImages = {};
  PRODUCTS.forEach(p => {
    const img = new Image();
    img.src = p.overlayImage;
    garmentImages[p.id] = img;
  });

  // 1. Render Catalog Selector
  const catalogGrid = document.getElementById("garment-selector-grid");
  if (catalogGrid) {
    catalogGrid.innerHTML = PRODUCTS.map((product, idx) => `
      <div class="garment-card ${idx === 0 ? 'active' : ''}" data-id="${product.id}">
        <span class="garment-card-icon">${product.category === 'Top' ? '👕' : '👗'}</span>
        <span class="garment-card-name">${product.name}</span>
      </div>
    `).join('');
    
    // Select product click handlers
    document.querySelectorAll(".garment-card").forEach(card => {
      card.addEventListener("click", (e) => {
        document.querySelectorAll(".garment-card").forEach(c => c.classList.remove("active"));
        const selectedCard = e.currentTarget;
        selectedCard.classList.add("active");
        
        const productId = selectedCard.getAttribute("data-id");
        activeProduct = PRODUCTS.find(p => p.id === productId);
        updateDashboard(activeProduct);
      });
    });
  }

  // 2. Initialize Dashboard Data
  updateDashboard(activeProduct);

  function updateDashboard(product) {
    document.getElementById("eco-category").textContent = product.category;
    document.getElementById("eco-name").textContent = product.name;
    document.getElementById("eco-description").textContent = product.description;
    document.getElementById("eco-material").textContent = product.material;
    
    const ratingBadge = document.getElementById("eco-rating");
    ratingBadge.textContent = product.ecoRating;
    ratingBadge.className = "details-value badge-rating";
    
    document.getElementById("eco-care").textContent = product.careGuide;
    
    // Animate Circular Progress Rings
    // Max values for calculation
    const maxWaterSaved = 100;
    const maxCarbonSaved = 120;
    
    updateCirclePercent("water-fill", "water-percent", product.waterSavings, maxWaterSaved);
    document.getElementById("water-saved-desc").textContent = `Hemat ${product.waterUsage}L air`;
    
    updateCirclePercent("carbon-fill", "carbon-percent", product.carbonSavings, maxCarbonSaved);
    document.getElementById("carbon-saved-desc").textContent = `Kurang ${product.carbonFootprint}kg CO₂`;
  }

  function updateCirclePercent(circleId, textId, percentValue, maxValue) {
    const circle = document.getElementById(circleId);
    const text = document.getElementById(textId);
    if (!circle || !text) return;
    
    // Animate fill path using SVG stroke offset
    const radius = 40;
    const circumference = 2 * Math.PI * radius; // 251.2
    const offset = circumference - (percentValue / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;
    text.textContent = `${percentValue}%`;
  }

  // 3. WebAR - Initialize Camera & MediaPipe Pose
  let poseInstance = null;
  let activeCamera = null;

  function initCamera() {
    loadingOverlay.style.display = "flex";
    fallbackUI.style.display = "none";
    
    // Request webcam access
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 640 }, 
        height: { ideal: 480 },
        facingMode: "user" 
      }, 
      audio: false 
    })
    .then((stream) => {
      activeStream = stream;
      webcamElement.srcObject = stream;
      webcamElement.addEventListener("loadedmetadata", () => {
        // Set canvas sizing matching video stream ratio
        canvasElement.width = webcamElement.videoWidth;
        canvasElement.height = webcamElement.videoHeight;
        
        // Start MediaPipe
        startMediaPipe();
      });
    })
    .catch((err) => {
      console.error("Camera access denied or error:", err);
      // Show gray fallback warning box
      loadingOverlay.style.display = "none";
      fallbackUI.style.display = "flex";
      trackingStatusBadge.textContent = "Kamera Ditolak";
      trackingStatusBadge.className = "hud-status";
    });
  }

  function startMediaPipe() {
    if (poseInstance) return; // already started
    
    poseInstance = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    
    poseInstance.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    poseInstance.onResults(onResults);
    
    // Setup camera rendering frames loop
    const fps = 30;
    let lastTime = 0;
    
    function renderLoop(time) {
      if (!activeStream) return;
      
      if (time - lastTime >= 1000 / fps) {
        poseInstance.send({ image: webcamElement })
          .catch(err => console.error("Error sending frame to MediaPipe:", err));
        lastTime = time;
      }
      requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);
  }

  // Draw overlay shirt on canvas based on Pose Landmark Coordinates
  function onResults(results) {
    // Hide loader overlay on first successful tracking frame
    if (loadingOverlay.style.display !== "none") {
      loadingOverlay.style.display = "none";
      document.getElementById("camera-viewport").classList.add("tracking");
    }
    
    // Clear canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw mirrored video stream frame
    if (isMirrored) {
      canvasCtx.translate(canvasElement.width, 0);
      canvasCtx.scale(-1, 1);
    }
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    
    if (results.poseLandmarks) {
      if (!trackingActive) {
        trackingActive = true;
        trackingStatusBadge.textContent = "Tracking Aktif";
        trackingStatusBadge.className = "hud-status active";
      }

      // Draw sensor skeleton bones if toggled (for tech presentations)
      if (showSkeleton) {
        drawSkeleton(results.poseLandmarks);
      }
      
      // Render garment overlay mapping coordinates
      drawGarmentOverlay(results.poseLandmarks);
      
    } else {
      if (trackingActive) {
        trackingActive = false;
        trackingStatusBadge.textContent = "Mencari Tubuh...";
        trackingStatusBadge.className = "hud-status";
      }
    }
    
    canvasCtx.restore();
  }

  // Draw 2D clothing image scaled and rotated over detected torso coordinates
  function drawGarmentOverlay(landmarks) {
    const lShoulder = landmarks[11];
    const rShoulder = landmarks[12];
    const lHip = landmarks[23];
    const rHip = landmarks[24];
    
    if (!lShoulder || !rShoulder) return;
    
    // Canvas conversion values
    const scaleX = canvasElement.width;
    const scaleY = canvasElement.height;
    
    const shoulderX = ((lShoulder.x + rShoulder.x) / 2) * scaleX;
    const shoulderY = ((lShoulder.y + rShoulder.y) / 2) * scaleY;
    
    // Distance between shoulders
    const dx = (rShoulder.x - lShoulder.x) * scaleX;
    const dy = (rShoulder.y - lShoulder.y) * scaleY;
    const shoulderDist = Math.sqrt(dx * dx + dy * dy);
    
    // Compute angle of shoulder tilt
    const angle = Math.atan2(dy, dx);
    
    // Determine overlay size scaling
    let overlayWidth = shoulderDist * 1.8;
    let overlayHeight = overlayWidth * 1.25; // default ratio
    
    if (lHip && rHip) {
      const hipX = ((lHip.x + rHip.x) / 2) * scaleX;
      const hipY = ((lHip.y + rHip.y) / 2) * scaleY;
      const heightDist = Math.sqrt(Math.pow(hipX - shoulderX, 2) + Math.pow(hipY - shoulderY, 2));
      overlayHeight = heightDist * 1.5; // Scale height based on spine length
    }
    
    // Adjust size/offset based on dress category vs top
    let yOffset = overlayHeight * 0.1; // offset collar downwards
    if (activeProduct.category === "Dress") {
      overlayWidth = shoulderDist * 2.1;
      overlayHeight = overlayWidth * 2.1;
      yOffset = overlayHeight * 0.05;
    }
    
    const garmentImg = garmentImages[activeProduct.id];
    
    if (garmentImg && garmentImg.complete) {
      canvasCtx.save();
      // Translate context to center of shoulders
      canvasCtx.translate(shoulderX, shoulderY + yOffset);
      canvasCtx.rotate(angle);
      
      // Draw centered garment overlay
      canvasCtx.drawImage(
        garmentImg, 
        -overlayWidth / 2, 
        0, 
        overlayWidth, 
        overlayHeight
      );
      canvasCtx.restore();
    }
  }

  // Draw 2D skeletal nodes for styling and presentation
  function drawSkeleton(landmarks) {
    const connections = [
      [11, 12], // shoulder-to-shoulder
      [11, 23], // left shoulder to hip
      [12, 24], // right shoulder to hip
      [23, 24]  // hip-to-hip
    ];
    
    canvasCtx.lineWidth = 3;
    canvasCtx.strokeStyle = "rgba(0, 245, 212, 0.7)"; // Cyan neon tracer lines
    canvasCtx.fillStyle = "rgba(59, 255, 20, 0.9)";   // Green glowing nodes
    
    connections.forEach(([i1, i2]) => {
      const pt1 = landmarks[i1];
      const pt2 = landmarks[i2];
      if (pt1 && pt2) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(pt1.x * canvasElement.width, pt1.y * canvasElement.height);
        canvasCtx.lineTo(pt2.x * canvasElement.width, pt2.y * canvasElement.height);
        canvasCtx.stroke();
      }
    });
    
    // Draw joints
    [11, 12, 23, 24].forEach(idx => {
      const pt = landmarks[idx];
      if (pt) {
        canvasCtx.beginPath();
        canvasCtx.arc(pt.x * canvasElement.width, pt.y * canvasElement.height, 6, 0, 2 * Math.PI);
        canvasCtx.fill();
      }
    });
  }

  // 4. Hook up Buttons
  retryBtn.addEventListener("click", () => {
    initCamera();
  });
  
  toggleSkeletonBtn.addEventListener("click", () => {
    showSkeleton = !showSkeleton;
    toggleSkeletonBtn.style.borderColor = showSkeleton ? "var(--accent-glow)" : "var(--border-color)";
    toggleSkeletonBtn.style.color = showSkeleton ? "var(--accent-glow)" : "var(--text-primary)";
  });
  
  mirrorBtn.addEventListener("click", () => {
    isMirrored = !isMirrored;
    mirrorBtn.style.borderColor = isMirrored ? "var(--accent-glow)" : "var(--border-color)";
    mirrorBtn.style.color = isMirrored ? "var(--accent-glow)" : "var(--text-primary)";
  });

  // Start Fitting Room Camera on Load
  initCamera();
});
