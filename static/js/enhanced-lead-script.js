document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("url-input");
  const analyzeBtn = document.getElementById("analyze-btn");
  const loadingElement = document.getElementById("loading");
  const resultsSection = document.getElementById("results-section");
  const resultsElement = document.getElementById("results");
  const resultsTemplate = document.getElementById("results-template");
  const leadTemplate = document.getElementById("lead-insights-template");
  let lastAnalysisData = null;

  // Handle analyze button click
  analyzeBtn.addEventListener("click", () => {
    const url = urlInput.value.trim();
    if (!url) {
      showError("Please enter a valid URL");
      return;
    }

    analyzeWebsite(url);
  });

  // Handle enter key in URL input
  urlInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      analyzeBtn.click();
    }
  });

  // Function to analyze website
  async function analyzeWebsite(url) {
    // Show loading indicator
    loadingElement.style.display = "flex";
    resultsSection.style.display = "none";
    resultsElement.innerHTML = "";

    try {
      // Validate URL format
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      // Send request to server
      const formData = new FormData();
      formData.append("url", url);

      const response = await fetch("/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      lastAnalysisData = data;

      // Hide loading indicator
      loadingElement.style.display = "none";

      // Display results or error
      if (data.error) {
        showError(data.error);
      } else {
        displayResults(data, url);
        resultsSection.style.display = "block";

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      loadingElement.style.display = "none";
      showError(`Analysis failed: ${error.message}`);
    }
  }

  // Function to show error message
  function showError(message) {
    resultsElement.innerHTML = `<div class="error-message">
            <i class="fas fa-exclamation-circle"></i> ${message}
        </div>`;
    resultsSection.style.display = "block";
  }

  // Function to display analysis results
  function displayResults(data, url) {
    // Clone the template
    const resultsContent = document.importNode(resultsTemplate.content, true);

    // Set company URL
    const displayUrl = url.replace(/(^\w+:|^)\/\//, "").replace(/\/$/, "");
    resultsContent.querySelector(".company-url").textContent = displayUrl;

    // Set AI readiness score
    resultsContent.querySelector(".score-value").textContent =
      data.ai_readiness_score;

    // Set score description
    resultsContent.querySelector(".score-description").textContent =
      getScoreDescription(data.ai_readiness_score);

    // Populate transformation opportunities
    const opportunitiesContainer = resultsContent.querySelector(
      ".opportunities-container"
    );
    if (
      data.transformation_opportunities &&
      data.transformation_opportunities.length > 0
    ) {
      data.transformation_opportunities.forEach((opportunity) => {
        const opportunityCard = document.createElement("div");
        opportunityCard.className = "opportunity-card";
        opportunityCard.innerHTML = `
                    <div class="opportunity-title">${opportunity.title}</div>
                    <div class="opportunity-description">${opportunity.description}</div>
                `;
        opportunitiesContainer.appendChild(opportunityCard);
      });
    } else {
      opportunitiesContainer.innerHTML =
        '<p class="empty-state">No specific transformation opportunities identified.</p>';
    }

    // Populate technology indicators
    const techIndicatorsContainer = resultsContent.querySelector(
      ".tech-indicators-container"
    );
    if (data.tech_indicators && Object.keys(data.tech_indicators).length > 0) {
      for (const [category, categoryData] of Object.entries(
        data.tech_indicators
      )) {
        const indicatorGroup = document.createElement("div");
        indicatorGroup.className = "indicator-group";

        const categoryName = formatCategoryName(category);
        indicatorGroup.innerHTML = `
                    <div class="indicator-category">
                        <span class="indicator-category-name">${categoryName}</span>
                        <span class="indicator-badge">${categoryData.total}</span>
                    </div>
                    <ul class="indicators-list"></ul>
                `;

        const indicatorsList = indicatorGroup.querySelector(".indicators-list");
        for (const [indicator, count] of Object.entries(
          categoryData.indicators
        )) {
          const listItem = document.createElement("li");
          listItem.className = "indicator-item";
          listItem.innerHTML = `
                        <span class="indicator-name">${indicator}</span>
                        <span class="indicator-count">${count}</span>
                    `;
          indicatorsList.appendChild(listItem);
        }

        techIndicatorsContainer.appendChild(indicatorGroup);
      }
    } else {
      techIndicatorsContainer.innerHTML =
        '<p class="empty-state">No significant technology indicators found.</p>';
    }

    // Populate leadership team
    const leadershipContainer = resultsContent.querySelector(
      ".leadership-container"
    );
    if (data.leadership_team && data.leadership_team.length > 0) {
      data.leadership_team.forEach((person) => {
        const leadershipItem = document.createElement("div");
        leadershipItem.className = "leadership-item";

        // Get initials for avatar
        const nameParts = person.name.split(" ");
        const initials =
          nameParts.length > 1
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
            : person.name[0];

        leadershipItem.innerHTML = `
                    <div class="leadership-avatar">${initials}</div>
                    <div class="leadership-details">
                        <div class="leadership-name">${person.name}</div>
                        <div class="leadership-title">${person.title}</div>
                    </div>
                `;

        leadershipContainer.appendChild(leadershipItem);
      });
    } else {
      leadershipContainer.innerHTML =
        '<p class="leadership-empty">No leadership team information found.</p>';
    }

    // Populate company info
    const companyInfoContainer = resultsContent.querySelector(
      ".company-info-container"
    );
    companyInfoContainer.innerHTML = `
            <div class="company-info-item">
                <div class="company-info-label">Company Size</div>
                <div class="company-info-value">${data.company_size_indicator}</div>
            </div>
        `;

    // Add growth indicators if available
    if (data.growth_indicators && data.growth_indicators.length > 0) {
      const growthItem = document.createElement("div");
      growthItem.className = "company-info-item";
      growthItem.innerHTML = `
                <div class="company-info-label">Growth Indicators</div>
                <div class="growth-indicators"></div>
            `;

      const growthIndicatorsContainer =
        growthItem.querySelector(".growth-indicators");
      data.growth_indicators.forEach((indicator) => {
        const badge = document.createElement("span");
        badge.className = "growth-badge";
        badge.textContent = indicator;
        growthIndicatorsContainer.appendChild(badge);
      });

      companyInfoContainer.appendChild(growthItem);
    }

    // Add contact information if available
    const emails = data.contact_info.emails || [];
    const phones = data.contact_info.phones || [];

    if (emails.length > 0 || phones.length > 0) {
      const contactItem = document.createElement("div");
      contactItem.className = "company-info-item";
      contactItem.innerHTML = `
                <div class="company-info-label">Contact Information</div>
                <ul class="contact-list"></ul>
            `;

      const contactList = contactItem.querySelector(".contact-list");

      emails.forEach((email) => {
        const listItem = document.createElement("li");
        listItem.className = "contact-item";
        listItem.innerHTML = `<i class="fas fa-envelope"></i> ${email}`;
        contactList.appendChild(listItem);
      });

      phones.forEach((phone) => {
        const listItem = document.createElement("li");
        listItem.className = "contact-item";
        listItem.innerHTML = `<i class="fas fa-phone"></i> ${phone}`;
        contactList.appendChild(listItem);
      });

      companyInfoContainer.appendChild(contactItem);
    }

    // Populate score components
    const scoreComponentsContainer = resultsContent.querySelector(
      ".score-components-container"
    );
    const scoreComponents = data.score_components || {};

    const componentMax = {
      technology_score: 10,
      leadership_score: 5,
      growth_score: 2,
    };

    if (scoreComponents) {
      // Technology score
      const techComponent = document.createElement("div");
      techComponent.className = "score-component";

      const techScore = scoreComponents.technology_score || 0;
      const techPercentage = Math.min(
        100,
        (techScore / componentMax.technology_score) * 100
      );

      techComponent.innerHTML = `
                <div class="company-info-label">Technology Score</div>
                <div class="component-bar">
                    <div class="component-fill" style="width: ${techPercentage}%"></div>
                </div>
                <div class="component-details">
                    <span>Score: ${techScore.toFixed(1)}</span>
                    <span>Weight: 60%</span>
                </div>
            `;
      scoreComponentsContainer.appendChild(techComponent);

      // Leadership score
      const leadershipComponent = document.createElement("div");
      leadershipComponent.className = "score-component";

      const leadershipScore = scoreComponents.leadership_score || 0;
      const leadershipPercentage = Math.min(
        100,
        (leadershipScore / componentMax.leadership_score) * 100
      );

      leadershipComponent.innerHTML = `
                <div class="company-info-label">Leadership Score</div>
                <div class="component-bar">
                    <div class="component-fill" style="width: ${leadershipPercentage}%"></div>
                </div>
                <div class="component-details">
                    <span>Score: ${leadershipScore.toFixed(1)}</span>
                    <span>Weight: 25%</span>
                </div>
            `;
      scoreComponentsContainer.appendChild(leadershipComponent);

      // Growth score
      const growthComponent = document.createElement("div");
      growthComponent.className = "score-component";

      const growthScore = scoreComponents.growth_score || 0;
      const growthPercentage = Math.min(
        100,
        (growthScore / componentMax.growth_score) * 100
      );

      growthComponent.innerHTML = `
                <div class="company-info-label">Growth Score</div>
                <div class="component-bar">
                    <div class="component-fill" style="width: ${growthPercentage}%"></div>
                </div>
                <div class="component-details">
                    <span>Score: ${growthScore.toFixed(1)}</span>
                    <span>Weight: 15%</span>
                </div>
            `;
      scoreComponentsContainer.appendChild(growthComponent);
    }

    // Set up the basic results first
    resultsElement.innerHTML = "";
    resultsElement.appendChild(resultsContent);

    // Add Lead Generation Insights if available
    if (data.sales_insights) {
      // Clone the lead insights template
      const leadContent = document.importNode(leadTemplate.content, true);

      // Populate lead score and tier
      const leadScore = data.sales_insights.lead_score || 0;
      leadContent.querySelector(".lead-score-value").textContent = leadScore;

      const leadTier = data.sales_insights.lead_tier || "Unknown";
      const tierElement = leadContent.querySelector(".lead-tier");
      tierElement.textContent = leadTier;

      // Apply appropriate class based on lead tier
      if (leadTier === "Hot") {
        tierElement.classList.add("tier-hot");
      } else if (leadTier === "Warm") {
        tierElement.classList.add("tier-warm");
      } else {
        tierElement.classList.add("tier-nurture");
      }

      // Populate primary contact information
      const primaryContact = data.sales_insights.primary_contact;
      const contactContainer = leadContent.querySelector(
        ".primary-contact-container"
      );

      if (primaryContact) {
        // Get initials for avatar
        const nameParts = primaryContact.name.split(" ");
        const initials =
          nameParts.length > 1
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
            : primaryContact.name[0];

        contactContainer.innerHTML = `
                    <div class="contact-card">
                        <div class="contact-avatar">${initials}</div>
                        <div class="contact-details">
                            <div class="contact-name">${primaryContact.name}</div>
                            <div class="contact-title">${primaryContact.title}</div>
                        </div>
                    </div>
                `;
      } else {
        contactContainer.innerHTML =
          '<p class="empty-state">No primary decision maker identified.</p>';
      }

      // Populate pain points
      const painPoints = data.sales_insights.pain_points || [];
      const painPointsContainer = leadContent.querySelector(
        ".pain-points-container"
      );

      if (painPoints.length > 0) {
        const painPointsList = document.createElement("ul");
        painPointsList.className = "pain-points-list";

        painPoints.forEach((point) => {
          const listItem = document.createElement("li");
          listItem.className = "pain-point-item";
          listItem.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${point}`;
          painPointsList.appendChild(listItem);
        });

        painPointsContainer.appendChild(painPointsList);
      } else {
        painPointsContainer.innerHTML =
          '<p class="empty-state">No specific pain points identified.</p>';
      }

      // Populate outreach recommendations
      const outreach = data.sales_insights.outreach_recommendation || {};
      const outreachContainer = leadContent.querySelector(
        ".outreach-container"
      );

      if (outreach.timing && outreach.approach) {
        const approach = outreach.approach;

        outreachContainer.innerHTML = `
                    <div class="outreach-timing">
                        <span class="outreach-label">Recommended Timing:</span>
                        <span class="outreach-value">${outreach.timing}</span>
                    </div>
                    <div class="outreach-approach">
                        <span class="outreach-label">Approach:</span>
                        <span class="outreach-value">${approach.focus} (${approach.message})</span>
                    </div>
                `;

        // Add conversation starters
        if (
          approach.conversation_starters &&
          approach.conversation_starters.length > 0
        ) {
          const startersContainer = document.createElement("div");
          startersContainer.className = "conversation-starters";
          startersContainer.innerHTML =
            '<div class="outreach-label">Conversation Starters:</div>';

          const startersList = document.createElement("ul");
          startersList.className = "starters-list";

          approach.conversation_starters.forEach((starter) => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `<i class="fas fa-comment"></i> ${starter}`;
            startersList.appendChild(listItem);
          });

          startersContainer.appendChild(startersList);
          outreachContainer.appendChild(startersContainer);
        }
      } else {
        outreachContainer.innerHTML =
          '<p class="empty-state">No outreach recommendations available.</p>';
      }

      // Populate lead score components
      const leadComponentsContainer = leadContent.querySelector(
        ".lead-components-container"
      );
      const leadComponents = data.sales_insights.score_components || {};

      if (Object.keys(leadComponents).length > 0) {
        // Decision maker score
        const decisionMakerComponent = document.createElement("div");
        decisionMakerComponent.className = "score-component";

        const dmScore = leadComponents.decision_maker_score || 0;
        const dmPercentage = Math.min(100, dmScore * 10);

        decisionMakerComponent.innerHTML = `
                    <div class="component-label">Decision Maker Influence</div>
                    <div class="component-bar">
                        <div class="component-fill" style="width: ${dmPercentage}%"></div>
                    </div>
                    <div class="component-details">
                        <span>Score: ${dmScore.toFixed(1)}</span>
                        <span>Weight: 30%</span>
                    </div>
                `;
        leadComponentsContainer.appendChild(decisionMakerComponent);

        // Tech investment score
        const techInvestmentComponent = document.createElement("div");
        techInvestmentComponent.className = "score-component";

        const tiScore = leadComponents.tech_investment_score || 0;
        const tiPercentage = Math.min(100, tiScore * 10);

        techInvestmentComponent.innerHTML = `
                    <div class="component-label">Technology Investment</div>
                    <div class="component-bar">
                        <div class="component-fill" style="width: ${tiPercentage}%"></div>
                    </div>
                    <div class="component-details">
                        <span>Score: ${tiScore.toFixed(1)}</span>
                        <span>Weight: 25%</span>
                    </div>
                `;
        leadComponentsContainer.appendChild(techInvestmentComponent);

        // Growth score for lead
        const growthLeadComponent = document.createElement("div");
        growthLeadComponent.className = "score-component";

        const glScore = leadComponents.growth_score || 0;
        const glPercentage = Math.min(100, glScore * 10);

        growthLeadComponent.innerHTML = `
                    <div class="component-label">Growth Potential</div>
                    <div class="component-bar">
                        <div class="component-fill" style="width: ${glPercentage}%"></div>
                    </div>
                    <div class="component-details">
                        <span>Score: ${glScore.toFixed(1)}</span>
                        <span>Weight: 25%</span>
                    </div>
                `;
        leadComponentsContainer.appendChild(growthLeadComponent);

        // AI readiness factor
        const aiFactorComponent = document.createElement("div");
        aiFactorComponent.className = "score-component";

        const aiScore = leadComponents.ai_readiness_factor || 0;
        const aiPercentage = Math.min(100, aiScore * 10);

        aiFactorComponent.innerHTML = `
                    <div class="component-label">AI Readiness Factor</div>
                    <div class="component-bar">
                        <div class="component-fill" style="width: ${aiPercentage}%"></div>
                    </div>
                    <div class="component-details">
                        <span>Score: ${aiScore.toFixed(1)}</span>
                        <span>Weight: 20%</span>
                    </div>
                `;
        leadComponentsContainer.appendChild(aiFactorComponent);
      }

      // Add export buttons
      const exportContainer = leadContent.querySelector(".export-container");

      const csvButton = document.createElement("button");
      csvButton.className = "export-btn csv-btn";
      csvButton.innerHTML = '<i class="fas fa-file-csv"></i> Export to CSV';
      csvButton.addEventListener("click", () => exportData("csv"));

      const jsonButton = document.createElement("button");
      jsonButton.className = "export-btn json-btn";
      jsonButton.innerHTML = '<i class="fas fa-file-code"></i> Export JSON';
      jsonButton.addEventListener("click", () => exportData("json"));

      exportContainer.appendChild(csvButton);
      exportContainer.appendChild(jsonButton);

      // Append the lead insights content to results
      resultsElement.appendChild(leadContent);
    }

    // Animate score count up
    animateScoreCount(".score-value", data.ai_readiness_score);

    // Animate lead score if available
    if (data.sales_insights) {
      animateScoreCount(".lead-score-value", data.sales_insights.lead_score);
    }
  }

  // Function to export data
  async function exportData(format) {
    if (!lastAnalysisData) {
      showError("No analysis data available to export");
      return;
    }

    try {
      let response;

      if (format === "csv") {
        response = await fetch("/export-csv", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(lastAnalysisData),
        });
      } else {
        response = await fetch("/export-json", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(lastAnalysisData),
        });
      }

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a temporary download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = format === "csv" ? "lead_data.csv" : "lead_analysis.json";

      // Append to the document and trigger the download
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      showError(`Export failed: ${error.message}`);
    }
  }

  // Function to animate score count
  function animateScoreCount(selector, targetScore) {
    const scoreElement = document.querySelector(selector);
    if (!scoreElement) return;

    const duration = 1500; // milliseconds
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    const increment = targetScore / totalFrames;

    let currentScore = 0;
    let frame = 0;

    const animate = () => {
      frame++;
      currentScore += increment;

      if (currentScore > targetScore) {
        currentScore = targetScore;
      }

      scoreElement.textContent = Math.floor(currentScore);

      if (frame < totalFrames && currentScore < targetScore) {
        requestAnimationFrame(animate);
      } else {
        scoreElement.textContent = targetScore;
      }
    };

    animate();
  }

  // Helper function to format category names
  function formatCategoryName(category) {
    switch (category) {
      case "ai_ml":
        return "AI & Machine Learning";
      case "data":
        return "Data Infrastructure";
      case "cloud":
        return "Cloud Technologies";
      case "integration":
        return "System Integration";
      case "automation":
        return "Process Automation";
      default:
        return category
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
    }
  }

  // Helper function to get score description
  function getScoreDescription(score) {
    if (score <= 3) {
      return "Early stage AI readiness. Significant transformation opportunities exist for Caprae Capital to add value through AI implementation.";
    } else if (score <= 6) {
      return "Developing AI capabilities. Good foundation with clear opportunities for strategic AI enhancements to accelerate growth.";
    } else if (score <= 8) {
      return "Advanced AI readiness. Strong technical foundation for sophisticated AI implementation and optimization.";
    } else {
      return "Excellent AI maturity. Well-positioned for leading-edge AI applications with potential for industry leadership.";
    }
  }
});
