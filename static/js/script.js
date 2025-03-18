document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("url-input");
  const analyzeBtn = document.getElementById("analyze-btn");
  const loadingElement = document.getElementById("loading");
  const resultsSection = document.getElementById("results-section");
  const resultsElement = document.getElementById("results");

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
    loadingElement.style.display = "block";
    resultsSection.style.display = "none";
    resultsElement.innerHTML = "";

    try {
      // Send request to server
      const formData = new FormData();
      formData.append("url", url);

      const response = await fetch("/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // Hide loading indicator
      loadingElement.style.display = "none";

      // Display results or error
      if (data.error) {
        showError(data.error);
      } else {
        displayResults(data);
        resultsSection.style.display = "block";
      }
    } catch (error) {
      loadingElement.style.display = "none";
      showError(`Analysis failed: ${error.message}`);
    }
  }

  // Function to show error message
  function showError(message) {
    resultsElement.innerHTML = `<div class="error-message">${message}</div>`;
    resultsSection.style.display = "block";
  }

  // Function to display analysis results
  function displayResults(data) {
    let scoreDescription = getScoreDescription(data.ai_readiness_score);

    let html = `
            <div class="score-card">
                <div class="score-value">${data.ai_readiness_score}/10</div>
                <div class="score-label">AI Readiness Score</div>
                <p class="score-description">${scoreDescription}</p>
            </div>
            
            <h2 class="section-title">Technology Indicators</h2>
        `;

    // Technology indicators
    if (Object.keys(data.tech_indicators).length > 0) {
      html += '<div class="indicators-list">';

      for (const [category, categoryData] of Object.entries(
        data.tech_indicators
      )) {
        let categoryName = formatCategoryName(category);
        html += `
                    <div class="indicator-card">
                        <div class="indicator-name">${categoryName}<span class="indicator-count">${categoryData.total}</span></div>
                        <div class="indicator-details">
                `;

        for (const [indicator, count] of Object.entries(
          categoryData.indicators
        )) {
          html += `<div>${indicator} (${count})</div>`;
        }

        html += `
                        </div>
                    </div>
                `;
      }

      html += "</div>";
    } else {
      html += "<p>No significant technology indicators found.</p>";
    }

    // Transformation opportunities
    html += `<h2 class="section-title">Transformation Opportunities</h2>`;

    if (data.transformation_opportunities.length > 0) {
      html += '<div class="opportunity-list">';

      for (const opportunity of data.transformation_opportunities) {
        html += `
                    <div class="opportunity-card">
                        <div class="opportunity-title">${opportunity.title}</div>
                        <div class="opportunity-description">${opportunity.description}</div>
                    </div>
                `;
      }

      html += "</div>";
    } else {
      html += "<p>No specific transformation opportunities identified.</p>";
    }

    // Leadership team
    html += `<h2 class="section-title">Leadership Team</h2>`;

    if (data.leadership_team.length > 0) {
      html += '<div class="team-list">';

      for (const person of data.leadership_team) {
        html += `
                    <div class="team-member">
                        <div class="member-name">${person.name}</div>
                        <div class="member-title">${person.title}</div>
                    </div>
                `;
      }

      html += "</div>";
    } else {
      html += "<p>No leadership team information found.</p>";
    }

    // Company and contact info
    html += `
            <h2 class="section-title">Company Profile</h2>
            <div class="company-info">
                <p><strong>Estimated Size:</strong> ${data.company_size_indicator}</p>
        `;

    if (data.growth_indicators.length > 0) {
      html += `<p><strong>Growth Indicators:</strong> ${data.growth_indicators.join(
        ", "
      )}</p>`;
    }

    const emails = data.contact_info.emails || [];
    const phones = data.contact_info.phones || [];

    if (emails.length > 0 || phones.length > 0) {
      html += `
                <p><strong>Contact Information:</strong></p>
                <div class="contact-info">
            `;

      for (const email of emails) {
        html += `<div class="contact-item">📧 ${email}</div>`;
      }

      for (const phone of phones) {
        html += `<div class="contact-item">📞 ${phone}</div>`;
      }

      html += "</div>";
    }

    html += "</div>";

    // Score components
    html += `
            <h2 class="section-title">Score Components</h2>
            <div class="company-info">
                <p><strong>Technology Score:</strong> ${data.score_components.technology_score}</p>
                <p><strong>Leadership Score:</strong> ${data.score_components.leadership_score}</p>
                <p><strong>Growth Score:</strong> ${data.score_components.growth_score}</p>
            </div>
        `;

    // Pages analyzed
    if (data.pages_analyzed && data.pages_analyzed.length > 0) {
      html += `
                <h2 class="section-title">Analysis Coverage</h2>
                <div class="company-info">
                    <p><strong>Pages Analyzed:</strong> ${data.pages_analyzed.length}</p>
                    <ul>
            `;

      for (const page of data.pages_analyzed) {
        html += `<li>${page}</li>`;
      }

      html += `
                    </ul>
                </div>
            `;
    }

    resultsElement.innerHTML = html;
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
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }

  // Helper function to get score description
  function getScoreDescription(score) {
    if (score <= 3) {
      return "Early stage AI readiness. Significant transformation opportunities exist.";
    } else if (score <= 6) {
      return "Developing AI capabilities. Good foundation with room for strategic improvements.";
    } else if (score <= 8) {
      return "Advanced AI readiness. Strong technical foundation for sophisticated AI implementations.";
    } else {
      return "Excellent AI maturity. Well-positioned for leading-edge AI applications.";
    }
  }
});
