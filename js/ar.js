document.addEventListener("DOMContentLoaded", () => {
  const webcamElement = document.getElementById("webcam");
  const canvasElement = document.getElementById("ar-canvas");
  const canvasCtx = canvasElement.getContext("2d");
  
  const loadingOverlay = document.getElementById("loading-overlay");
  const fallbackUI = document.getElementById("webcam-fallback-ui");
  const cameraCover = document.getElementById("camera-disabled-cover");
  const scanFeedback = document.getElementById("scan-feedback-banner");
  
  const startCameraBtn = document.getElementById("btn-start-camera");
  const skipCameraBtn = document.getElementById("btn-skip-camera");
  const skipCameraFallbackBtn = document.getElementById("btn-skip-camera-fallback");
  const retryBtn = document.getElementById("btn-retry-webcam");
  
  const toggleSkeletonBtn = document.getElementById("btn-toggle-skeleton");
  const mirrorBtn = document.getElementById("btn-mirror");
  const trackingStatusBadge = document.getElementById("tracking-status-badge");
  const cameraHud = document.getElementById("camera-hud");
  
  const catalogDrawer = document.getElementById("catalog-drawer");
  const dashboardDetails = document.getElementById("dashboard-details");
  
  let activeProduct = PRODUCTS[0];
  let showSkeleton = false;
  let isMirrored = true;
  let trackingActive = false;
  let activeStream = null;
  let hasBypassed = false;
  
  // Pre-load garment overlay images
  const garmentImages = {};
  PRODUCTS.forEach(p => {
    const img = new Image();
    img.src = p.overlayImage;
    garmentImages[p.id] = img;
  });

  // 1. Render Catalog Selector Grid
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

  // Initialize Dashboard with first product (but hidden initially until activated or bypassed)
  updateDashboard(activeProduct);

  function updateDashboard(product) {
    document.getElementById("eco-category").textContent = product.category;
    document.getElementById("eco-name").textContent = product.name;
    document.getElementById("eco-description").textContent = product.description;
    document.getElementById("eco-material").textContent = product.material;
    
    const ratingBadge = document.getElementById("eco-rating");
    ratingBadge.textContent = product.ecoRating;
    
    document.getElementById("eco-care").textContent = product.careGuide;
    
    // Animate Circular Progress Rings
    const maxWaterSaved = 100;
    const maxCarbonSaved = 120;
    
    updateCirclePercent("water-fill", "water-percent", product.waterSavings, maxWaterSaved);
    document.getElementById("water-saved-desc").textContent = `Hemat ${product.waterUsage}L air`;
    
    updateCirclePercent("carbon-fill", "carbon-percent", product.carbonSavings, maxCarbonSaved);
    document.getElementById("carbon-saved-desc").textContent = `Kurang ${product.carbonFootprint}kg CO₂`;
    
    // Render Mix & Match recommendation (Flowchart Steps 9 & 10)
    if (product.mixMatch) {
      const mix = product.mixMatch;
      let mixIcon = "👖"; // default Bottom
      if (mix.category === "Outer") mixIcon = "🧥";
      if (mix.category === "Top") mixIcon = "👕";
      if (mix.category === "Dress") mixIcon = "👗";
      
      document.getElementById("mix-icon").textContent = mixIcon;
      document.getElementById("mix-name").textContent = mix.name;
      document.getElementById("mix-material").textContent = `${mix.material} • Hemat ${mix.waterUsage}L air`;
      document.getElementById("mix-category").textContent = mix.category;
    }
  }

  function updateCirclePercent(circleId, textId, percentValue, maxValue) {
    const circle = document.getElementById(circleId);
    const text = document.getElementById(textId);
    if (!circle || !text) return;
    
    const radius = 40;
    const circumference = 2 * Math.PI * radius; // 251.2
    const offset = circumference - (percentValue / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;
    text.textContent = `${percentValue}%`;
  }

  // 2. Camera Access Control & Bypass
  function initCamera() {
    cameraCover.style.display = "none";
    loadingOverlay.style.display = "flex";
    fallbackUI.style.display = "none";
    
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
        canvasElement.width = webcamElement.videoWidth;
        canvasElement.height = webcamElement.videoHeight;
        
        // Show scan tracer feedback banner initially (Flowchart Step 5a)
        scanFeedback.style.display = "block";
        scanFeedback.textContent = "🔍 Memindai Tag Pakaian...";
        
        // Simulate Scan detection loop (Step 5)
        setTimeout(() => {
          scanFeedback.style.display = "none";
          // Transition to success & retrieve product data (Steps 6 & 7)
          loadingOverlay.style.display = "none";
          cameraHud.style.display = "flex";
          catalogDrawer.style.display = "block";
          dashboardDetails.style.display = "block";
          
          startMediaPipe();
        }, 2200);
      });
    })
    .catch((err) => {
      console.error("Camera access denied or error:", err);
      loadingOverlay.style.display = "none";
      fallbackUI.style.display = "flex";
      trackingStatusBadge.textContent = "Kamera Ditolak";
      trackingStatusBadge.className = "hud-status";
    });
  }

  // Bypass webcam (directly skips to product detail/mixmatch display)
  function bypassCamera() {
    hasBypassed = true;
    cameraCover.style.display = "none";
    fallbackUI.style.display = "none";
    loadingOverlay.style.display = "none";
    
    // Open features panels directly
    catalogDrawer.style.display = "block";
    dashboardDetails.style.display = "block";
    
    // Draw static helper text on canvas indicating webcam bypassed
    canvasElement.width = 640;
    canvasElement.height = 480;
    drawBypassScreen();
  }

  function drawBypassScreen() {
    canvasCtx.fillStyle = "#efeae0";
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    
    canvasCtx.fillStyle = "#122c20";
    canvasCtx.font = "italic 500 1.25rem Lora";
    canvasCtx.textAlign = "center";
    canvasCtx.fillText("Kamera AR Dihindari", canvasElement.width / 2, canvasElement.height / 2 - 20);
    
    canvasCtx.fillStyle = "#647d70";
    canvasCtx.font = "14px Inter";
    canvasCtx.fillText("Memilih produk di katalog kanan untuk melihat data langsung.", canvasElement.width / 2, canvasElement.height / 2 + 10);
  }

  // 3. MediaPipe Pose tracking
  function startMediaPipe() {
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
    
    const fps = 30;
    let lastTime = 0;
    
    function renderLoop(time) {
      if (!activeStream || hasBypassed) return;
      
      if (time - lastTime >= 1000 / fps) {
        poseInstance.send({ image: webcamElement })
          .catch(err => console.error("Error sending frame to MediaPipe:", err));
        lastTime = time;
      }
      requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);
  }

  function onResults(results) {
    if (hasBypassed) return;
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
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
        scanFeedback.style.display = "none";
      }

      if (showSkeleton) {
        drawSkeleton(results.poseLandmarks);
      }
      
      drawGarmentOverlay(results.poseLandmarks);
      
    } else {
      if (trackingActive) {
        trackingActive = false;
        trackingStatusBadge.textContent = "Mencari Tubuh...";
        trackingStatusBadge.className = "hud-status";
      }
      
      // Step 5a: Tag/Body not detected feedback warning
      scanFeedback.style.display = "block";
      scanFeedback.innerHTML = "⚠️ Tag/Tubuh tidak terdeteksi. Posisikan badan di tengah.";
    }
    
    canvasCtx.restore();
  }

  function drawGarmentOverlay(landmarks) {
    const lShoulder = landmarks[11];
    const rShoulder = landmarks[12];
    const lHip = landmarks[23];
    const rHip = landmarks[24];
    
    if (!lShoulder || !rShoulder) return;
    
    const scaleX = canvasElement.width;
    const scaleY = canvasElement.height;
    
    const shoulderX = ((lShoulder.x + rShoulder.x) / 2) * scaleX;
    const shoulderY = ((lShoulder.y + rShoulder.y) / 2) * scaleY;
    
    const dx = (rShoulder.x - lShoulder.x) * scaleX;
    const dy = (rShoulder.y - lShoulder.y) * scaleY;
    const shoulderDist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    let overlayWidth = shoulderDist * 1.8;
    let overlayHeight = overlayWidth * 1.25;
    
    if (lHip && rHip) {
      const hipX = ((lHip.x + rHip.x) / 2) * scaleX;
      const hipY = ((lHip.y + rHip.y) / 2) * scaleY;
      const heightDist = Math.sqrt(Math.pow(hipX - shoulderX, 2) + Math.pow(hipY - shoulderY, 2));
      overlayHeight = heightDist * 1.5;
    }
    
    let yOffset = overlayHeight * 0.1;
    if (activeProduct.category === "Dress") {
      overlayWidth = shoulderDist * 2.1;
      overlayHeight = overlayWidth * 2.1;
      yOffset = overlayHeight * 0.05;
    }
    
    const garmentImg = garmentImages[activeProduct.id];
    
    if (garmentImg && garmentImg.complete) {
      canvasCtx.save();
      canvasCtx.translate(shoulderX, shoulderY + yOffset);
      canvasCtx.rotate(angle);
      
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

  function drawSkeleton(landmarks) {
    const connections = [
      [11, 12], [11, 23], [12, 24], [23, 24]
    ];
    
    canvasCtx.lineWidth = 3;
    canvasCtx.strokeStyle = "rgba(0, 150, 136, 0.8)"; 
    canvasCtx.fillStyle = "rgba(11, 135, 86, 0.9)";   
    
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
  startCameraBtn.addEventListener("click", () => {
    initCamera();
  });
  
  skipCameraBtn.addEventListener("click", () => {
    bypassCamera();
  });
  
  skipCameraFallbackBtn.addEventListener("click", () => {
    bypassCamera();
  });
  
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
    
    if (hasBypassed) {
      drawBypassScreen();
    }
  });

  // Note: We DO NOT auto-start camera here (Webcam disabled on load per user request).
});
