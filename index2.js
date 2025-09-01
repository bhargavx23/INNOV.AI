document.addEventListener("DOMContentLoaded", () => {
  const ideaInput = document.getElementById("idea-input");
  const generateButton = document.getElementById("generate-button");
  const responseContainer1 = document.getElementById("chat-response-1");
  const loadingSpinner1 = document.getElementById("loading-spinner-1");
  const voiceButton = document.getElementById("voice-button");
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    voiceButton.addEventListener("click", () => {
      voiceButton.classList.add("animate-pulse");
      ideaInput.placeholder = "Listening...";
      recognition.start();
    });
    recognition.addEventListener("result", (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("");
      ideaInput.value = transcript;
    });
    recognition.addEventListener("end", () => {
      voiceButton.classList.remove("animate-pulse");
      ideaInput.placeholder = "Enter a problem area (or speak)...";
    });
    recognition.addEventListener("error", (event) => {
      console.error("Speech recognition error:", event.error);
      voiceButton.classList.remove("animate-pulse");
      ideaInput.placeholder = "Error, please try again.";
    });
  } else {
    voiceButton.style.display = "none";
  }
  // Function to add a message to the chat container
  const addMessageToChat = (sender, message) => {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("flex", "my-4", "fade-in");
    const messageContent = document.createElement("div");
    messageContent.classList.add("chat-message", "max-w-xs", "md:max-w-md");
    if (sender === "user") {
      messageDiv.classList.add("justify-end");
      messageContent.classList.add("user-message");
      messageContent.textContent = message;
    } else {
      messageDiv.classList.add("justify-start");
      messageContent.innerHTML = formatMarkdown(message);
    }
    messageDiv.appendChild(messageContent);
    responseContainer1.appendChild(messageDiv);
    responseContainer1.scrollTop = responseContainer1.scrollHeight; // Auto-scroll to the bottom
  };
  // Function to format the markdown text into HTML
  const formatMarkdown = (text) => {
    const lines = text.split("\n");
    let htmlContent = "";
    let inList = false;
    let listTag = "";
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("###")) {
        if (inList) {
          htmlContent += `${listTag === "ul" ? "</ul>" : "</ol>"}`;
          inList = false;
        }
        htmlContent += `<h3 class="text-xl font-bold mt-4 mb-2" style="color:var(--accent-1);">${trimmedLine
          .substring(3)
          .trim()}</h3>`;
      } else if (trimmedLine.match(/^\s*-\s/)) {
        // Handles bullet points
        if (!inList || listTag !== "ul") {
          if (inList) htmlContent += "</ol>";
          htmlContent += "<ul>";
          inList = true;
          listTag = "ul";
        }
        const formattedText = trimmedLine
          .replace(/^\s*-\s/, "")
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        htmlContent += `<li class="ml-4">${formattedText}</li>`;
      } else if (trimmedLine.match(/^\s*\d+\.\s/)) {
        // Handles numbered lists
        if (!inList || listTag !== "ol") {
          if (inList) htmlContent += "</ul>";
          htmlContent += "<ol>";
          inList = true;
          listTag = "ol";
        }
        const formattedText = trimmedLine
          .replace(/^\s*\d+\.\s/, "")
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        htmlContent += `<li class="ml-4">${formattedText}</li>`;
      } else if (trimmedLine !== "") {
        if (inList) {
          htmlContent += `${listTag === "ul" ? "</ul>" : "</ol>"}`;
          inList = false;
        }
        // Basic markdown bolding and italics
        const formattedText = trimmedLine
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>");
        htmlContent += `<p>${formattedText}</p>`;
      }
    });
    if (inList) {
      htmlContent += `${listTag === "ul" ? "</ul>" : "</ol>"}`;
    }
    return htmlContent;
  };
  const businessPlanInput = document.getElementById("business-plan-input");
  const businessPlanButton = document.getElementById("business-plan-button");
  const businessPlanResponse = document.getElementById(
    "business-plan-response"
  );
  const loadingSpinner2 = document.getElementById("loading-spinner-2");
  const taglineInput = document.getElementById("tagline-input");
  const taglineButton = document.getElementById("tagline-button");
  const taglineResponse = document.getElementById("tagline-response");
  const loadingSpinner3 = document.getElementById("loading-spinner-3");
  const imageInput = document.getElementById("image-input");
  const imageGenerateButton = document.getElementById("image-generate-button");
  const imageResponse = document.getElementById("image-response");
  const generatedImage = document.getElementById("generated-image");
  const imagePlaceholder = document.getElementById("image-placeholder");
  const loadingSpinner4 = document.getElementById("loading-spinner-4");
  // Function to handle API calls for text generation
  const callGeminiApi = async (
    prompt,
    responseContainer,
    loadingSpinner,
    isIdeaGenerator = false
  ) => {
    loadingSpinner.classList.remove("hidden");

    // Add user message to chat log for the main idea generator
    if (isIdeaGenerator) {
      responseContainer.innerHTML =
        '<p class="text-center font-semibold text-[var(--secondary-text-color)]">Thinking...</p>';
      addMessageToChat("user", prompt);
      ideaInput.value = ""; // Clear input field
    }
    const apiKey = "AIzaSyD62SirEsTLHpTUgeyg5pkyWuhcAV5rRLw";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    let payload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };
    // Add system instruction for the main idea generator
    if (isIdeaGenerator) {
      payload.systemInstruction = {
        parts: [
          {
            text: "You are a friendly and encouraging AI named 'INNOV.AI Buddy'. Your goal is to help users find awesome, real-world startup ideas. Respond in a casual, conversational, and helpful tone. For the main idea generation, provide the startup idea and a clear, organized, numbered list of steps that a user can follow to start their business. The steps should be actionable and cover everything from validation to launch. Do not give irrelevant responses and always stay on topic.",
          },
        ],
      };
    }
    let responseText = "";
    let attempts = 0;
    const maxAttempts = 3;
    let successful = false;
    while (attempts < maxAttempts && !successful) {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `API returned an error: ${response.status} - ${errorData.error.message}`
          );
        }
        const result = await response.json();
        const candidate = result.candidates?.[0];
        if (candidate && candidate.content?.parts?.[0]?.text) {
          responseText = candidate.content.parts[0].text;
          successful = true;
        } else {
          throw new Error("No content in API response");
        }
      } catch (error) {
        console.error("Error fetching API:", error);
        attempts++;
        if (attempts < maxAttempts) {
          // Exponential backoff
          await new Promise((res) => setTimeout(res, 2 ** attempts * 1000));
        } else {
          responseText =
            "Apologies, it seems there's a problem connecting to the AI. Please check your internet connection and try again. If the problem persists, the service may be temporarily unavailable.";
        }
      }
    }
    loadingSpinner.classList.add("hidden");
    if (isIdeaGenerator) {
      responseContainer.innerHTML = ""; // Clear chat panel
      addMessageToChat("ai", responseText);
    } else {
      responseContainer.innerHTML = formatMarkdown(responseText);
      responseContainer.classList.add("fade-in");
    }
  };
  // Function to handle API calls for image generation
  const callImageApi = async (prompt, responseContainer, loadingSpinner) => {
    loadingSpinner.classList.remove("hidden");
    generatedImage.classList.add("hidden");
    imagePlaceholder.classList.remove("hidden");
    const payload = {
      instances: { prompt: prompt },
      parameters: { sampleCount: 1 },
    };
    const apiKey = "AIzaSyD62SirEsTLHpTUgeyg5pkyWuhcAV5rRLw";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      const base64Data = result?.predictions?.[0]?.bytesBase64Encoded;
      if (base64Data) {
        const imageUrl = `https:image/png;base64,${base64Data}`;
        generatedImage.src = imageUrl;
        generatedImage.classList.remove("hidden");
        imagePlaceholder.classList.add("hidden");
      } else {
        imagePlaceholder.textContent =
          "Sorry, I couldn't generate an image. Please try again.";
        imagePlaceholder.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Error fetching image API:", error);
      imagePlaceholder.textContent =
        "An error occurred while generating the image. Please try again later.";
      imagePlaceholder.classList.remove("hidden");
    } finally {
      loadingSpinner.classList.add("hidden");
    }
  };
  // Event listener for the "Get Your Idea" button
  generateButton.addEventListener("click", () => {
    const userPrompt = ideaInput.value.trim();
    if (userPrompt) {
      callGeminiApi(userPrompt, responseContainer1, loadingSpinner1, true);
    }
  });
  // Event listener for "Enter" key on the main input field
  ideaInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default behavior (e.g., new line)
      generateButton.click(); // Trigger the button's click event
    }
  });
  // Event listener for the "Generate Outline" button
  businessPlanButton.addEventListener("click", () => {
    const userPrompt = businessPlanInput.value.trim();
    if (userPrompt) {
      const fullPrompt = `Generate a comprehensive business plan outline for a startup based on the following idea: "${userPrompt}". Include sections for:
            - Executive Summary
            - Problem and Solution
            - Target Market Analysis
            - Competitive Analysis
            - Marketing and Sales Strategy
            - Operations Plan
            - Financial Projections (conceptual)
            - Team and Management
            - Appendix
            Make the outline detailed with bullet points under each section.`;
      callGeminiApi(fullPrompt, businessPlanResponse, loadingSpinner2);
    } else {
      businessPlanResponse.innerHTML =
        '<p class="text-[var(--secondary-text-color)] text-center">Please enter a startup idea to generate an outline.</p>';
    }
  });
  // Event listener for the "Get Names & Taglines" button
  taglineButton.addEventListener("click", () => {
    const userPrompt = taglineInput.value.trim();
    if (userPrompt) {
      const fullPrompt = `Suggest 5 unique and catchy names and 5 corresponding taglines for a startup based on this idea: "${userPrompt}". Present the output with "### Names" and "### Taglines" headings.`;
      callGeminiApi(fullPrompt, taglineResponse, loadingSpinner3);
    } else {
      taglineResponse.innerHTML =
        '<p class="text-[var(--secondary-text-color)] text-center">Please enter a startup idea to get name and tagline suggestions.</p>';
    }
  });
  // Event listener for the "Generate Image" button
  imageGenerateButton.addEventListener("click", () => {
    const userPrompt = imageInput.value.trim();
    if (userPrompt) {
      callImageApi(userPrompt, imageResponse, loadingSpinner4);
    } else {
      imagePlaceholder.textContent =
        "Please enter a description to generate an image.";
      imagePlaceholder.classList.remove("hidden");
    }
  });
  
  // Parallax effect for floating shapes
  const shapes = document.querySelectorAll(".parallax-bg");
  document.addEventListener("mousemove", (e) => {
    const x = (window.innerWidth - e.pageX * 2) / 100;
    const y = (window.innerHeight - e.pageY * 2) / 100;
    shapes.forEach((shape) => {
      const depth = shape.getAttribute("data-depth");
      const moveX = x * depth;
      const moveY = y * depth;
      shape.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  });
  // Chatbot functionality
  const chatToggle = document.getElementById("chat-toggle");
  const chatPopup = document.getElementById("chat-popup");
  const chatBody = document.getElementById("chat-body");
  const chatInput = document.getElementById("chat-input");
  const sendChatBtn = document.getElementById("send-chat-btn");
  const closeChatBtn = document.getElementById("close-chat");
  const backdropOverlay = document.getElementById("backdrop-overlay");

  chatToggle.addEventListener("click", () => {
    chatPopup.classList.toggle("open");
    backdropOverlay.classList.toggle("open");
  });
  closeChatBtn.addEventListener("click", () => {
    chatPopup.classList.remove("open");
    backdropOverlay.classList.remove("open");
  });
  backdropOverlay.addEventListener("click", () => {
    chatPopup.classList.remove("open");
    backdropOverlay.classList.remove("open");
  });

  // Function to add a message to the chat container
  const addChatbotMessage = (message, sender = "bot") => {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    if (sender === "user") {
      messageDiv.classList.add("user-message");
    } else {
      messageDiv.classList.add("bot-message");
    }
    messageDiv.textContent = message;
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  };

  // New function to handle the API call for the chatbot
  const callChatbotApi = async (prompt) => {
    const tempMessage = "Thinking...";
    const loadingMessageDiv = document.createElement("div");
    loadingMessageDiv.classList.add("message", "bot-message");
    loadingMessageDiv.textContent = tempMessage;
    chatBody.appendChild(loadingMessageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    const apiKey = "AIzaSyD62SirEsTLHpTUgeyg5pkyWuhcAV5rRLw";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      tools: [{ google_search: {} }],
      systemInstruction: {
        parts: [
          {
            text: "You are a friendly, humorous, and entertaining AI named 'INNOV.AI Buddy'. Your goal is to have funny, light-hearted conversations with the user. You can also answer general questions, but always maintain a casual and funny tone.",
          },
        ],
      },
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      const responseText =
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't get a response. Maybe the punchline got lost in the cloud... Try asking again!";

      loadingMessageDiv.textContent = responseText;
      chatBody.scrollTop = chatBody.scrollHeight;
    } catch (error) {
      console.error("Error fetching chatbot API:", error);
      loadingMessageDiv.textContent =
        "Apologies, it seems there's a problem connecting. My jokes must be too powerful for the servers. Please try again.";
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  };

  // Event listener for the chatbot's send button
  sendChatBtn.addEventListener("click", () => {
    const userMessage = chatInput.value.trim();
    if (userMessage) {
      addChatbotMessage(userMessage, "user");
      chatInput.value = "";
      callChatbotApi(userMessage);
    }
  });
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendChatBtn.click();
    }
  });

  // Dynamic Theme Changer
  const themes = [
    {
      bg: "#0F172A",
      cardBg: "#1E293B",
      mainBgGradStart: "#1E293B",
      mainBgGradEnd: "#0F172A",
      accent1: "#06B6D4",
      accent2: "#38BDF8",
      glow: "#38BDF8",
      glowLight: "#52a7ec",
      button: "#9333ea",
      buttonHover: "#a855f7",
    },
    {
      bg: "#1A2E2A",
      cardBg: "#213B36",
      mainBgGradStart: "#213B36",
      mainBgGradEnd: "#1A2E2A",
      accent1: "#34D399",
      accent2: "#10B981",
      glow: "#34D399",
      glowLight: "#5eead4",
      button: "#EC4899",
      buttonHover: "#F472B6",
    },
    {
      bg: "#261E16",
      cardBg: "#3B2F21",
      mainBgGradStart: "#3B2F21",
      mainBgGradEnd: "#261E16",
      accent1: "#D97706",
      accent2: "#F59E0B",
      glow: "#F59E0B",
      glowLight: "#fbbf24",
      button: "#9333ea",
      buttonHover: "#a855f7",
    },
  ];
  let currentThemeIndex = 0;
  const themeToggleButton = document.getElementById("theme-toggle");
  const root = document.documentElement;

  const updateTheme = (theme) => {
    root.style.setProperty("--bg-color", theme.bg);
    root.style.setProperty("--card-bg-color", theme.cardBg);
    root.style.setProperty("--main-bg-gradient-start", theme.mainBgGradStart);
    root.style.setProperty("--main-bg-gradient-end", theme.mainBgGradEnd);
    root.style.setProperty("--accent-1", theme.accent1);
    root.style.setProperty("--accent-2", theme.accent2);
    root.style.setProperty("--button-color", theme.button);
    root.style.setProperty("--button-hover", theme.buttonHover);
    root.style.setProperty("--glow-color", theme.glow);
    root.style.setProperty("--glow-color-light", theme.glowLight);

    // Update RGB values for transparency
    const hexToRgb = (hex) => {
      let r = 0,
        g = 0,
        b = 0;
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
      }
      return `${r}, ${g}, ${b}`;
    };
    root.style.setProperty("--accent-1-rgb", hexToRgb(theme.accent1));
    root.style.setProperty("--accent-2-rgb", hexToRgb(theme.accent2));
    root.style.setProperty("--glow-color-rgb", hexToRgb(theme.glow));
  };

  themeToggleButton.addEventListener("click", () => {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    updateTheme(themes[currentThemeIndex]);
  });

  // Set initial theme
  updateTheme(themes[currentThemeIndex]);

  // Mobile menu toggle
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileLinks = mobileMenu.querySelectorAll("a");

  menuToggle.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");
    backdropOverlay.classList.toggle("open");
  });

  mobileLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const href = link.getAttribute("href");
      mobileMenu.classList.remove("open");
      backdropOverlay.classList.remove("open");
      if (href.startsWith("#")) {
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });

  // Close mobile menu when clicking on backdrop
  backdropOverlay.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    backdropOverlay.classList.remove("open");
  });
});
