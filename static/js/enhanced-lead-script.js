document.addEventListener("DOMContentLoaded", () => {
  // Element references for main functionality
  const urlInput = document.getElementById("url-input");
  const analyzeBtn = document.getElementById("analyze-btn");
  const loadingElement = document.getElementById("loading");
  const resultsSection = document.getElementById("results-section");
  const resultsElement = document.getElementById("results");
  const resultsTemplate = document.getElementById("results-template");
  const leadTemplate = document.getElementById("lead-insights-template");

  // Element references for new features
  const savedLeadsBtn = document.getElementById("saved-leads-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const leadsDashboard = document.getElementById("leads-dashboard");
  const searchSection = document.getElementById("search-section");
  const crmSettings = document.getElementById("crm-settings");
  const closeSettings = document.getElementById("close-settings");
  const crmprovider = document.getElementById("crm-provider");
  const customFields = document.getElementById("custom-fields");
  const verificationPanel = document.getElementById("verification-panel");
  const closeVerification = document.getElementById("close-verification");
  const filterToggle = document.getElementById("filter-toggle");
  const filterBody = document.getElementById("filter-body");
  const dateFilter = document.getElementById("date-filter");
  const customDateContainer = document.getElementById("custom-date-container");
  const batchExportBtn = document.getElementById("batch-export-btn");
  const exportModal = document.getElementById("export-modal");
  const closeExportModal = document.getElementById("close-export-modal");
  const cancelExport = document.getElementById("cancel-export");

  // State management
  let lastAnalysisData = null;
  let savedLeads = loadSavedLeads();
  let currentPage = 1;
  let itemsPerPage = 10;
  let sortField = "lead_score";
  let sortDirection = "desc";
  let appliedFilters = {
    leadTier: ["Hot", "Warm", "Nurture"],
    aiScore: [0, 10],
    techFocus: ["ai_ml", "data", "cloud", "integration"],
    companySize: ["Small", "Medium", "Large", "Enterprise"],
    verificationStatus: ["Verified", "Pending", "Flagged"],
    dateAdded: "all",
    customDateRange: {
      from: "",
      to: "",
    },
  };

  // Initialize pagination elements
  const prevPageBtn = document.getElementById("prev-page");
  const nextPageBtn = document.getElementById("next-page");
  const pageIndicator = document.getElementById("page-indicator");

  // Initialize event listeners for main functionality
  analyzeBtn.addEventListener("click", () => {
    const url = urlInput.value.trim();
    if (!url) {
      showError("Please enter a valid URL");
      return;
    }
    analyzeWebsite(url);
  });

  urlInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      analyzeBtn.click();
    }
  });

  // Initialize event listeners for new features
  savedLeadsBtn.addEventListener("click", () => {
    showLeadsDashboard();
  });

  settingsBtn.addEventListener("click", () => {
    showSettingsPanel();
  });

  closeSettings.addEventListener("click", () => {
    hideSettingsPanel();
  });

  closeVerification.addEventListener("click", () => {
    hideVerificationPanel();
  });

  crmprovider.addEventListener("change", () => {
    if (crmprovider.value === "custom") {
      customFields.style.display = "block";
    } else {
      customFields.style.display = "none";
    }
  });

  filterToggle.addEventListener("click", () => {
    // Toggle filter body visibility
    if (filterBody.style.display === "none") {
      filterBody.style.display = "grid";
      filterToggle
        .querySelector("i")
        .classList.replace("fa-chevron-down", "fa-chevron-up");
    } else {
      filterBody.style.display = "none";
      filterToggle
        .querySelector("i")
        .classList.replace("fa-chevron-up", "fa-chevron-down");
    }
  });

  dateFilter.addEventListener("change", () => {
    if (dateFilter.value === "custom") {
      customDateContainer.style.display = "flex";
    } else {
      customDateContainer.style.display = "none";
    }
  });

  // Apply filters button
  document.getElementById("apply-filters").addEventListener("click", () => {
    updateFilters();
    renderLeadsTable();
  });

  // Reset filters button
  document.getElementById("reset-filters").addEventListener("click", () => {
    resetFilters();
  });

  // Batch export functionality
  batchExportBtn.addEventListener("click", () => {
    showExportModal();
  });

  closeExportModal.addEventListener("click", () => {
    hideExportModal();
  });

  cancelExport.addEventListener("click", () => {
    hideExportModal();
  });

  // Select all leads checkbox
  document
    .getElementById("select-all-leads")
    .addEventListener("change", (e) => {
      const checkboxes = document.querySelectorAll(".lead-select-checkbox");
      checkboxes.forEach((checkbox) => {
        checkbox.checked = e.target.checked;
      });
      updateExportButtonText();
    });

  // Event listeners for export options
  document.querySelectorAll(".option-button[data-format]").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all format buttons
      document.querySelectorAll(".option-button[data-format]").forEach((b) => {
        b.classList.remove("active");
      });
      // Add active class to clicked button
      btn.classList.add("active");
    });
  });

  document.querySelectorAll(".delivery-option").forEach((option) => {
    option.addEventListener("click", () => {
      // Remove active class from all delivery options
      document.querySelectorAll(".delivery-option").forEach((o) => {
        o.classList.remove("active");
      });
      // Add active class to clicked option
      option.classList.add("active");

      // Show/hide email options
      if (option.getAttribute("data-delivery") === "email") {
        document.getElementById("email-options").style.display = "block";
      } else {
        document.getElementById("email-options").style.display = "none";
      }
    });
  });

  // Export action button
  document.getElementById("export-action").addEventListener("click", () => {
    // Get selected export format
    const format = document
      .querySelector(".option-button[data-format].active")
      .getAttribute("data-format");
    // Get selected delivery method
    const delivery = document
      .querySelector(".delivery-option.active")
      .getAttribute("data-delivery");

    // Get selected leads
    const selectedLeads = getSelectedLeads();

    if (selectedLeads.length === 0) {
      alert("Please select at least one lead to export");
      return;
    }

    // Get selected fields
    const selectedFields = getSelectedExportFields();

    if (delivery === "download") {
      exportSelectedLeads(selectedLeads, format, selectedFields);
    } else if (delivery === "email") {
      const recipientEmail = document.getElementById("email-recipient").value;
      const subject = document.getElementById("email-subject").value;
      const message = document.getElementById("email-message").value;

      if (!recipientEmail) {
        alert("Please enter a recipient email");
        return;
      }

      emailExportedLeads(
        selectedLeads,
        format,
        selectedFields,
        recipientEmail,
        subject,
        message
      );
    }
  });

  // Pagination event listeners
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderLeadsTable();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(filterLeads().length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderLeadsTable();
    }
  });

  // Sort table headers
  document.addEventListener("click", (e) => {
    if (e.target.closest(".sortable")) {
      const th = e.target.closest(".sortable");
      const field = th.getAttribute("data-sort");

      // If clicking on the same header, toggle direction
      if (field === sortField) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else {
        sortField = field;
        sortDirection = "desc"; // Default to descending for new sort field
      }

      // Update header classes
      document.querySelectorAll(".sortable").forEach((header) => {
        header.classList.remove("sort-asc", "sort-desc");
      });

      th.classList.add(`sort-${sortDirection}`);

      renderLeadsTable();
    }
  });

  // Save lead to dashboard
  document.addEventListener("click", (e) => {
    if (e.target.id === "save-lead" || e.target.closest("#save-lead")) {
      if (lastAnalysisData) {
        saveLead(lastAnalysisData);
        showNotification("Lead saved successfully", "success");
      }
    }
  });

  // Verify lead now
  document.addEventListener("click", (e) => {
    if (e.target.id === "verify-now" || e.target.closest("#verify-now")) {
      if (lastAnalysisData) {
        showVerificationPanel(lastAnalysisData);
      }
    }
  });

  // Initialize verification actions
  document.getElementById("verify-lead").addEventListener("click", () => {
    const leadId = verificationPanel.getAttribute("data-lead-id");
    const notes = document.getElementById("verification-notes").value;

    // Update lead verification status in saved leads
    const leadIndex = savedLeads.findIndex((lead) => lead.id === leadId);
    if (leadIndex !== -1) {
      savedLeads[leadIndex].verification = {
        status: "Verified",
        date: new Date().toISOString(),
        notes: notes,
      };

      // Save updated leads list
      localStorage.setItem("savedLeads", JSON.stringify(savedLeads));

      showNotification("Lead verified successfully", "success");
      hideVerificationPanel();
      renderLeadsTable();
    }
  });

  document.getElementById("flag-lead").addEventListener("click", () => {
    const leadId = verificationPanel.getAttribute("data-lead-id");
    const notes = document.getElementById("verification-notes").value;

    // Update lead verification status in saved leads
    const leadIndex = savedLeads.findIndex((lead) => lead.id === leadId);
    if (leadIndex !== -1) {
      savedLeads[leadIndex].verification = {
        status: "Flagged",
        date: new Date().toISOString(),
        notes: notes,
      };

      // Save updated leads list
      localStorage.setItem("savedLeads", JSON.stringify(savedLeads));

      showNotification("Lead flagged for review", "warning");
      hideVerificationPanel();
      renderLeadsTable();
    }
  });

  document.getElementById("discard-lead").addEventListener("click", () => {
    const leadId = verificationPanel.getAttribute("data-lead-id");

    // Remove lead from saved leads
    savedLeads = savedLeads.filter((lead) => lead.id !== leadId);

    // Save updated leads list
    localStorage.setItem("savedLeads", JSON.stringify(savedLeads));

    showNotification("Lead discarded", "danger");
    hideVerificationPanel();
    renderLeadsTable();
  });

  // CRM Integration
  document.getElementById("save-settings").addEventListener("click", () => {
    const settings = {
      provider: document.getElementById("crm-provider").value,
      apiKey: document.getElementById("api-key").value,
      apiSecret: document.getElementById("api-secret").value,
      apiUrl: document.getElementById("api-url").value,
      autoSync: document.getElementById("auto-sync").checked,
      syncUpdates: document.getElementById("sync-updates").checked,
      biDirectional: document.getElementById("bi-directional-sync").checked,
      syncFrequency: document.getElementById("sync-frequency").value,
    };

    localStorage.setItem("crmSettings", JSON.stringify(settings));
    showNotification("CRM settings saved successfully", "success");
    hideSettingsPanel();
  });

  document.getElementById("crm-sync-btn").addEventListener("click", () => {
    // Get selected leads
    const selectedLeads = getSelectedLeads();

    if (selectedLeads.length === 0) {
      alert("Please select at least one lead to sync to CRM");
      return;
    }

    syncLeadsToCRM(selectedLeads);
  });

  // Test CRM connection
  document.getElementById("test-connection").addEventListener("click", () => {
    // Simulate testing connection
    showNotification("Testing CRM connection...", "info");

    setTimeout(() => {
      showNotification("CRM connection successful!", "success");
    }, 1500);
  });

  // Edit verification fields
  document.querySelectorAll(".edit-field-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const fieldContainer = e.target.closest(".editable-field");
      const fieldValue = fieldContainer.querySelector(".field-value");
      const currentValue = fieldValue.textContent.trim();

      // Create an input element to replace the current value
      const input = document.createElement("input");
      input.type = "text";
      input.value = currentValue;
      input.className = "edit-field-input";
      input.style.width = "100%";
      input.style.padding = "0.25rem";
      input.style.border = "1px solid var(--primary-color)";
      input.style.borderRadius = "4px";

      // Replace the field value with the input
      fieldValue.style.display = "none";
      fieldContainer.insertBefore(input, fieldValue);

      // Change the edit button to a save button
      btn.innerHTML = '<i class="fas fa-check"></i>';
      btn.classList.add("save-field-btn");

      // Focus on the input
      input.focus();

      // Event listener for saving the edited value
      const saveField = () => {
        fieldValue.textContent = input.value.trim();
        fieldValue.style.display = "";
        input.remove();
        btn.innerHTML = '<i class="fas fa-pen"></i>';
        btn.classList.remove("save-field-btn");
      };

      // Save on button click
      btn.removeEventListener("click", btn.clickEvent);
      btn.clickEvent = (e) => {
        if (btn.classList.contains("save-field-btn")) {
          saveField();
          e.stopPropagation();
        }
      };
      btn.addEventListener("click", btn.clickEvent);

      // Save on enter key
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          saveField();
        }
      });

      // Save on blur
      input.addEventListener("blur", () => {
        saveField();
      });
    });
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

        // Auto-verify lead if enabled
        if (document.getElementById("enable-verification").checked) {
          // Add verification status to data
          data.verification = {
            status: "Pending",
            date: new Date().toISOString(),
            notes: "",
          };
        }

        // Auto-sync to CRM if enabled
        if (document.getElementById("crm-auto-sync").checked) {
          if (lastAnalysisData.sales_insights) {
            // Prepare for CRM sync
            const crmStatus = {
              status: "Queued",
              date: new Date().toISOString(),
            };
            lastAnalysisData.crm = crmStatus;

            // Simulate CRM sync
            setTimeout(() => {
              showNotification("Lead automatically synced to CRM", "success");
            }, 2000);
          }
        }

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
    const emails = data.contact_info?.emails || [];
    const phones = data.contact_info?.phones || [];

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

      // Enhanced action buttons
      const actionsContainer = leadContent.querySelector(
        ".lead-actions-container"
      );

      // Export buttons
      const exportButtons = actionsContainer.querySelector(".export-buttons");

      // Add event listeners for export buttons
      const csvButton = exportButtons.querySelector(".csv-btn");
      csvButton.addEventListener("click", () => exportData("csv"));

      const jsonButton = exportButtons.querySelector(".json-btn");
      jsonButton.addEventListener("click", () => exportData("json"));

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

  // Function to show leads dashboard
  function showLeadsDashboard() {
    resultsSection.style.display = "none";
    leadsDashboard.style.display = "block";
    searchSection.style.display = "none";

    // Render leads table
    renderLeadsTable();
  }

  // Function to show analysis section
  function showAnalysisSection() {
    resultsSection.style.display = "none";
    leadsDashboard.style.display = "none";
    searchSection.style.display = "block";
  }

  // Function to show settings panel
  function showSettingsPanel() {
    crmSettings.classList.add("active");
    document.body.classList.add("panel-open");
    addOverlay();

    // Load saved settings
    loadSavedSettings();
  }

  // Function to hide settings panel
  function hideSettingsPanel() {
    crmSettings.classList.remove("active");
    document.body.classList.remove("panel-open");
    removeOverlay();
  }

  // Function to show verification panel
  function showVerificationPanel(lead) {
    // Populate verification panel with lead data
    const company =
      lead.company_name || new URL(lead.url).hostname.replace("www.", "");
    document.getElementById("verification-company-name").textContent = company;
    document.getElementById("verification-company-url").textContent =
      lead.url || "";

    // Fill company size
    document.getElementById("company-size-value").textContent =
      lead.company_size_indicator || "Unknown";

    // Fill AI score
    document.getElementById("ai-score-value").textContent = `${lead.ai_readiness_score || 0
      } / 10`;

    // Fill lead score and tier
    if (lead.sales_insights) {
      document.getElementById("lead-score-value").textContent = `${lead.sales_insights.lead_score || 0
        } / 100`;

      const tierElement = document.getElementById("lead-tier-value");
      tierElement.textContent = lead.sales_insights.lead_tier || "Unknown";
      tierElement.className = "field-value";

      if (lead.sales_insights.lead_tier === "Hot") {
        tierElement.classList.add("tier-hot");
      } else if (lead.sales_insights.lead_tier === "Warm") {
        tierElement.classList.add("tier-warm");
      } else {
        tierElement.classList.add("tier-nurture");
      }

      // Fill approach
      if (
        lead.sales_insights.outreach_recommendation &&
        lead.sales_insights.outreach_recommendation.approach
      ) {
        document.getElementById("approach-value").textContent =
          lead.sales_insights.outreach_recommendation.approach.focus ||
          "General";
      }

      // Fill primary contact
      if (lead.sales_insights.primary_contact) {
        document.getElementById("contact-name-value").textContent =
          lead.sales_insights.primary_contact.name || "Unknown";
        document.getElementById("contact-title-value").textContent =
          lead.sales_insights.primary_contact.title || "Unknown";
        document.getElementById("contact-email-value").textContent =
          lead.sales_insights.primary_contact.email || "Unknown";
        document.getElementById("contact-phone-value").textContent =
          lead.sales_insights.primary_contact.phone || "Unknown";
      }
    }

    // Fill tech indicators
    if (lead.tech_indicators) {
      const techStackValue = document.getElementById("tech-stack-value");
      techStackValue.innerHTML = "";

      // Combine all indicators
      const allIndicators = [];
      for (const category in lead.tech_indicators) {
        for (const indicator in lead.tech_indicators[category].indicators) {
          allIndicators.push(indicator);
        }
      }

      // Create tech indicator spans
      allIndicators.slice(0, 10).forEach((indicator) => {
        const span = document.createElement("span");
        span.className = "tech-indicator";
        span.textContent = indicator;
        techStackValue.appendChild(span);
      });

      if (allIndicators.length > 10) {
        const span = document.createElement("span");
        span.className = "tech-indicator";
        span.textContent = `+${allIndicators.length - 10} more`;
        techStackValue.appendChild(span);
      }
    }

    // Fill industry and location with placeholder data
    document.getElementById("company-industry-value").textContent =
      "Software & Technology";
    document.getElementById("company-location-value").textContent =
      "San Francisco, CA";

    // Clear verification notes
    document.getElementById("verification-notes").value =
      lead.verification?.notes || "";

    // Set lead ID for reference
    verificationPanel.setAttribute("data-lead-id", lead.id);

    // Show panel
    verificationPanel.classList.add("active");
    document.body.classList.add("panel-open");
    addOverlay();
  }

  // Function to hide verification panel
  function hideVerificationPanel() {
    verificationPanel.classList.remove("active");
    document.body.classList.remove("panel-open");
    removeOverlay();
  }

  // Function to show export modal
  function showExportModal() {
    // Update export button text
    updateExportButtonText();

    // Show modal
    exportModal.classList.add("active");
  }

  // Function to hide export modal
  function hideExportModal() {
    exportModal.classList.remove("active");
  }

  // Function to update export button text
  function updateExportButtonText() {
    const selectedCount = document.querySelectorAll(
      ".lead-select-checkbox:checked"
    ).length;
    document.getElementById(
      "export-action"
    ).textContent = `Export ${selectedCount} Lead${selectedCount !== 1 ? "s" : ""
      }`;
  }

  // Function to add overlay
  function addOverlay() {
    let overlay = document.querySelector(".overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "overlay";
      document.body.appendChild(overlay);
    }

    setTimeout(() => {
      overlay.classList.add("active");
    }, 10);

    overlay.addEventListener("click", () => {
      hideSettingsPanel();
      hideVerificationPanel();
      hideExportModal();
    });
  }

  // Function to remove overlay
  function removeOverlay() {
    const overlay = document.querySelector(".overlay");
    if (overlay) {
      overlay.classList.remove("active");

      setTimeout(() => {
        overlay.remove();
      }, 300);
    }
  }

  // Function to save lead
  function saveLead(data) {
    // Generate unique ID
    const id = `lead_${Date.now()}`;

    // Extract relevant information
    const company =
      data.company_name ||
      new URL(data.url || window.location.href).hostname.replace("www.", "");

    // Prepare lead object
    const lead = {
      id,
      url: urlInput.value,
      company_name: company,
      date_added: new Date().toISOString(),
      ai_readiness_score: data.ai_readiness_score,
      company_size_indicator: data.company_size_indicator,
      tech_indicators: data.tech_indicators,
      leadership_team: data.leadership_team,
      sales_insights: data.sales_insights,
      verification: data.verification || {
        status: "Pending",
        date: new Date().toISOString(),
        notes: "",
      },
      crm: data.crm || {
        status: "Not Synced",
        date: null,
      },
    };

    // Add to saved leads
    savedLeads.push(lead);

    // Save to localStorage
    localStorage.setItem("savedLeads", JSON.stringify(savedLeads));

    // If in dashboard, refresh the table
    if (leadsDashboard.style.display === "block") {
      renderLeadsTable();
    }

    return lead;
  }

  // Function to render leads table
  function renderLeadsTable() {
    const tableBody = document.getElementById("leads-table-body");
    tableBody.innerHTML = "";

    // Get filtered and sorted leads
    const filteredLeads = filterLeads();

    // Sort leads
    const sortedLeads = sortLeads(filteredLeads);

    // Paginate leads
    const paginatedLeads = paginateLeads(sortedLeads);

    if (paginatedLeads.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `
        <td colspan="8" class="empty-table">
          <p>No leads found. Try adjusting your filters or adding new leads.</p>
        </td>
      `;
      tableBody.appendChild(emptyRow);
    } else {
      // Create rows for each lead
      paginatedLeads.forEach((lead) => {
        const row = document.createElement("tr");

        // Create lead tier badge based on tier
        let tierBadge = "";
        if (lead.sales_insights && lead.sales_insights.lead_tier) {
          const tierClass =
            lead.sales_insights.lead_tier === "Hot"
              ? "tier-hot"
              : lead.sales_insights.lead_tier === "Warm"
                ? "tier-warm"
                : "tier-nurture";
          tierBadge = `<span class="${tierClass}">${lead.sales_insights.lead_tier}</span>`;
        } else {
          tierBadge = '<span class="tier-nurture">Nurture</span>';
        }

        // Create verification status badge
        let verificationBadge = "";
        if (lead.verification) {
          const statusClass =
            lead.verification.status === "Verified"
              ? "status-verified"
              : lead.verification.status === "Flagged"
                ? "status-flagged"
                : "status-pending";
          const statusIcon =
            lead.verification.status === "Verified"
              ? "fa-check-circle"
              : lead.verification.status === "Flagged"
                ? "fa-flag"
                : "fa-clock";
          verificationBadge = `
            <span class="status-badge ${statusClass}">
              <i class="fas ${statusIcon}"></i> ${lead.verification.status}
            </span>
          `;
        } else {
          verificationBadge = `
            <span class="status-badge status-pending">
              <i class="fas fa-clock"></i> Pending
            </span>
          `;
        }

        // Create CRM status badge
        let crmBadge = "";
        if (lead.crm) {
          const crmClass =
            lead.crm.status === "Synced"
              ? "status-synced"
              : lead.crm.status === "Failed"
                ? "status-failed"
                : lead.crm.status === "Queued"
                  ? "status-queued"
                  : "status-pending";
          const crmIcon =
            lead.crm.status === "Synced"
              ? "fa-check-circle"
              : lead.crm.status === "Failed"
                ? "fa-exclamation-circle"
                : lead.crm.status === "Queued"
                  ? "fa-sync"
                  : "fa-times-circle";
          crmBadge = `
            <span class="status-badge ${crmClass}">
              <i class="fas ${crmIcon}"></i> ${lead.crm.status}
            </span>
          `;
        } else {
          crmBadge = `
            <span class="status-badge status-pending">
              <i class="fas fa-times-circle"></i> Not Synced
            </span>
          `;
        }

        // Create contact display
        let contactDisplay = "";
        if (lead.sales_insights && lead.sales_insights.primary_contact) {
          const contact = lead.sales_insights.primary_contact;
          const nameParts = contact.name.split(" ");
          const initials =
            nameParts.length > 1
              ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
              : contact.name[0];

          contactDisplay = `
            <div class="contact-display">
              <div class="contact-mini-avatar">${initials}</div>
              <div class="contact-mini-info">
                <div class="contact-mini-name">${contact.name}</div>
                <div class="contact-mini-title">${contact.title}</div>
              </div>
            </div>
          `;
        } else {
          contactDisplay = `<span class="empty-contact">No contact found</span>`;
        }

        // Create row HTML
        row.innerHTML = `
          <td><input type="checkbox" class="lead-select-checkbox" data-id="${lead.id}"></td>
          <td>${lead.company_name}</td>
          <td>${lead.ai_readiness_score}</td>
          <td>${tierBadge}</td>
          <td>${contactDisplay}</td>
          <td>${verificationBadge}</td>
          <td>${crmBadge}</td>
          <td>
            <div class="lead-actions">
              <button class="action-icon verify-btn" data-id="${lead.id}" title="Verify Lead">
                <i class="fas fa-clipboard-check"></i>
              </button>
              <button class="action-icon details-btn" data-id="${lead.id}" title="View Details">
                <i class="fas fa-search"></i>
              </button>
              <button class="action-icon sync-btn" data-id="${lead.id}" title="Sync to CRM">
                <i class="fas fa-sync"></i>
              </button>
              <button class="action-icon delete-btn" data-id="${lead.id}" title="Delete Lead">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        `;

        // Add event listeners for action buttons
        tableBody.appendChild(row);
      });

      // Add event listeners for action buttons
      document.querySelectorAll(".verify-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const leadId = btn.getAttribute("data-id");
          const lead = savedLeads.find((l) => l.id === leadId);
          if (lead) {
            showVerificationPanel(lead);
          }
        });
      });

      document.querySelectorAll(".details-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const leadId = btn.getAttribute("data-id");
          const lead = savedLeads.find((l) => l.id === leadId);
          if (lead) {
            // Set as last analysis data
            lastAnalysisData = lead;

            // Switch to results view
            leadsDashboard.style.display = "none";
            searchSection.style.display = "block";

            // Display results
            displayResults(lead, lead.url);
            resultsSection.style.display = "block";
          }
        });
      });

      document.querySelectorAll(".sync-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const leadId = btn.getAttribute("data-id");
          const lead = savedLeads.find((l) => l.id === leadId);
          if (lead) {
            syncLeadToCRM(lead);
          }
        });
      });

      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const leadId = btn.getAttribute("data-id");
          if (confirm("Are you sure you want to delete this lead?")) {
            savedLeads = savedLeads.filter((l) => l.id !== leadId);
            localStorage.setItem("savedLeads", JSON.stringify(savedLeads));
            renderLeadsTable();
          }
        });
      });

      // Add checkbox event listeners
      document.querySelectorAll(".lead-select-checkbox").forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          updateExportButtonText();
        });
      });
    }

    // Update pagination
    updatePagination(sortedLeads.length);
  }

  // Function to update pagination
  function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages || 1}`;

    // Enable/disable previous button
    if (currentPage <= 1) {
      prevPageBtn.disabled = true;
    } else {
      prevPageBtn.disabled = false;
    }

    // Enable/disable next button
    if (currentPage >= totalPages) {
      nextPageBtn.disabled = true;
    } else {
      nextPageBtn.disabled = false;
    }
  }

  // Function to filter leads
  function filterLeads() {
    return savedLeads.filter((lead) => {
      // Filter by lead tier
      if (
        lead.sales_insights &&
        lead.sales_insights.lead_tier &&
        !appliedFilters.leadTier.includes(lead.sales_insights.lead_tier)
      ) {
        return false;
      }

      // Filter by AI score
      if (
        lead.ai_readiness_score < appliedFilters.aiScore[0] ||
        lead.ai_readiness_score > appliedFilters.aiScore[1]
      ) {
        return false;
      }

      // Filter by tech focus
      if (lead.tech_indicators) {
        const hasTech = appliedFilters.techFocus.some(
          (tech) => lead.tech_indicators[tech] !== undefined
        );
        if (!hasTech) {
          return false;
        }
      }

      // Filter by company size
      if (lead.company_size_indicator) {
        const sizeMapping = {
          "Small Business (< 50 employees)": "Small",
          "Medium Business (50-250 employees)": "Medium",
          "Large Business (251-1000 employees)": "Large",
          "Enterprise (1000+ employees)": "Enterprise",
        };

        const size = sizeMapping[lead.company_size_indicator] || "Unknown";
        if (!appliedFilters.companySize.includes(size)) {
          return false;
        }
      }

      // Filter by verification status
      if (
        lead.verification &&
        !appliedFilters.verificationStatus.includes(lead.verification.status)
      ) {
        return false;
      }

      // Filter by date added
      if (appliedFilters.dateAdded !== "all") {
        const leadDate = new Date(lead.date_added);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (appliedFilters.dateAdded === "today") {
          if (leadDate < today) {
            return false;
          }
        } else if (appliedFilters.dateAdded === "week") {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          if (leadDate < weekStart) {
            return false;
          }
        } else if (appliedFilters.dateAdded === "month") {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          if (leadDate < monthStart) {
            return false;
          }
        } else if (appliedFilters.dateAdded === "custom") {
          if (appliedFilters.customDateRange.from) {
            const fromDate = new Date(appliedFilters.customDateRange.from);
            if (leadDate < fromDate) {
              return false;
            }
          }

          if (appliedFilters.customDateRange.to) {
            const toDate = new Date(appliedFilters.customDateRange.to);
            toDate.setHours(23, 59, 59, 999);
            if (leadDate > toDate) {
              return false;
            }
          }
        }
      }

      return true;
    });
  }

  // Function to sort leads
  function sortLeads(leads) {
    return [...leads].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "company":
          aValue = a.company_name || "";
          bValue = b.company_name || "";
          break;
        case "score":
          aValue = a.ai_readiness_score || 0;
          bValue = b.ai_readiness_score || 0;
          break;
        case "tier":
          const tierRank = {
            Hot: 3,
            Warm: 2,
            Nurture: 1,
            Unknown: 0,
          };
          aValue = a.sales_insights?.lead_tier
            ? tierRank[a.sales_insights.lead_tier]
            : 0;
          bValue = b.sales_insights?.lead_tier
            ? tierRank[b.sales_insights.lead_tier]
            : 0;
          break;
        case "verification":
          const verificationRank = {
            Verified: 3,
            Pending: 2,
            Flagged: 1,
            Unknown: 0,
          };
          aValue = a.verification?.status
            ? verificationRank[a.verification.status]
            : 0;
          bValue = b.verification?.status
            ? verificationRank[b.verification.status]
            : 0;
          break;
        case "crm":
          const crmRank = {
            Synced: 3,
            Queued: 2,
            Failed: 1,
            "Not Synced": 0,
          };
          aValue = a.crm?.status ? crmRank[a.crm.status] : 0;
          bValue = b.crm?.status ? crmRank[b.crm.status] : 0;
          break;
        default:
          aValue = a[sortField] || 0;
          bValue = b[sortField] || 0;
      }

      // Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle numeric comparison
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
  }

  // Function to paginate leads
  function paginateLeads(leads) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return leads.slice(startIndex, endIndex);
  }

  // Add CSS for notifications
  function addNotificationStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .notification {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        max-width: 450px;
        animation: notification-slide-in 0.3s ease;
        transition: transform 0.3s ease, opacity 0.3s ease;
      }
      
      .notification-hide {
        transform: translateX(120%);
        opacity: 0;
      }
      
      @keyframes notification-slide-in {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      .notification i:first-child {
        font-size: 1.25rem;
      }
      
      .notification span {
        flex: 1;
      }
      
      .notification-close {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-light);
        padding: 4px;
      }
      
      .notification-info i:first-child {
        color: var(--primary-color);
      }
      
      .notification-success i:first-child {
        color: var(--success-color);
      }
      
      .notification-warning i:first-child {
        color: var(--warning-color);
      }
      
      .notification-danger i:first-child {
        color: var(--danger-color);
      }
    `;
    document.head.appendChild(style);
  }

  // Call to add notification styles
  addNotificationStyles();

  // Initialize backend communication handlers
  function initBackendHandlers() {
    // API endpoint for saving leads to server
    document.addEventListener("click", (e) => {
      if (e.target.id === "save-lead" || e.target.closest("#save-lead")) {
        if (lastAnalysisData) {
          // First save locally
          const savedLead = saveLead(lastAnalysisData);

          // Then save to server for persistence
          fetch("/save-lead", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(savedLead),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.status === "success") {
                showNotification(
                  `Lead "${savedLead.company_name}" saved successfully`,
                  "success"
                );
              } else {
                showNotification(`Warning: ${data.message}`, "warning");
              }
            })
            .catch((error) => {
              console.error("Error saving lead:", error);
              showNotification(
                "Lead saved locally but server sync failed",
                "warning"
              );
            });
        }
      }
    });

    // Sync lead verification with server
    document.getElementById("verify-lead").addEventListener("click", () => {
      const leadId = verificationPanel.getAttribute("data-lead-id");
      const notes = document.getElementById("verification-notes").value;

      // Update lead locally first
      const leadIndex = savedLeads.findIndex((lead) => lead.id === leadId);
      if (leadIndex !== -1) {
        const verificationData = {
          id: leadId,
          status: "Verified",
          notes: notes,
          verified_by: "User", // Could be replaced with actual user information
        };

        // Update server
        fetch("/verify-lead", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(verificationData),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.status === "success") {
              // Update local data
              savedLeads[leadIndex].verification = data.verification;
              localStorage.setItem("savedLeads", JSON.stringify(savedLeads));

              showNotification("Lead verified successfully", "success");
              hideVerificationPanel();
              renderLeadsTable();
            } else {
              showNotification(
                `Verification error: ${data.message}`,
                "warning"
              );
            }
          })
          .catch((error) => {
            console.error("Error verifying lead:", error);
            showNotification(
              "Lead verified locally but server sync failed",
              "warning"
            );

            // Still update locally as fallback
            savedLeads[leadIndex].verification = {
              status: "Verified",
              date: new Date().toISOString(),
              notes: notes,
            };
            localStorage.setItem("savedLeads", JSON.stringify(savedLeads));

            hideVerificationPanel();
            renderLeadsTable();
          });
      }
    });

    // CRM sync with server
    document.getElementById("crm-sync-btn").addEventListener("click", () => {
      const selectedLeads = getSelectedLeads();

      if (selectedLeads.length === 0) {
        showNotification(
          "Please select at least one lead to sync to CRM",
          "warning"
        );
        return;
      }

      const leadIds = selectedLeads.map((lead) => lead.id);
      const crmSettings = JSON.parse(localStorage.getItem("crmSettings")) || {};

      showNotification(
        `Syncing ${selectedLeads.length} leads to CRM...`,
        "info"
      );

      fetch("/crm-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lead_ids: leadIds,
          settings: crmSettings,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            // Update local leads with new CRM status
            const results = data.results;
            results.forEach((result) => {
              const leadIndex = savedLeads.findIndex(
                (lead) => lead.id === result.id
              );
              if (leadIndex !== -1 && result.status === "success") {
                savedLeads[leadIndex].crm = {
                  status: "Synced",
                  date: new Date().toISOString(),
                  crm_id: result.crm_id,
                };
              } else if (leadIndex !== -1) {
                savedLeads[leadIndex].crm = {
                  status: "Failed",
                  date: new Date().toISOString(),
                  error: result.message,
                };
              }
            });

            // Save updated leads
            localStorage.setItem("savedLeads", JSON.stringify(savedLeads));

            // Refresh the table
            renderLeadsTable();

            showNotification(`Successfully synced leads to CRM`, "success");
          } else {
            showNotification(`CRM sync error: ${data.message}`, "danger");
          }
        })
        .catch((error) => {
          console.error("Error syncing to CRM:", error);
          showNotification("CRM sync failed. Please try again.", "danger");
        });
    });

    // Email export functionality
    document.addEventListener("click", (e) => {
      const exportAction = document.getElementById("export-action");
      if (e.target === exportAction || e.target.closest("#export-action")) {
        const format = document
          .querySelector(".option-button[data-format].active")
          .getAttribute("data-format");
        const delivery = document
          .querySelector(".delivery-option.active")
          .getAttribute("data-delivery");

        if (delivery === "email") {
          const selectedLeads = getSelectedLeads();
          const selectedFields = getSelectedExportFields();
          const recipientEmail =
            document.getElementById("email-recipient").value;
          const subject = document.getElementById("email-subject").value;
          const message = document.getElementById("email-message").value;

          if (!recipientEmail) {
            showNotification(
              "Please enter a recipient email address",
              "warning"
            );
            return;
          }

          if (selectedLeads.length === 0) {
            showNotification(
              "Please select at least one lead to export",
              "warning"
            );
            return;
          }

          showNotification(
            `Preparing to email ${selectedLeads.length} leads...`,
            "info"
          );

          fetch("/email-export", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              recipient: recipientEmail,
              subject: subject,
              message: message,
              format: format,
              leads: selectedLeads,
              field_selection: selectedFields,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.status === "success") {
                showNotification(
                  `Export successfully sent to ${recipientEmail}`,
                  "success"
                );
                hideExportModal();
              } else {
                showNotification(`Email error: ${data.message}`, "danger");
              }
            })
            .catch((error) => {
              console.error("Error sending email:", error);
              showNotification(
                "Failed to send email. Please try again.",
                "danger"
              );
            });
        }
      }
    });

    // Load saved leads from server
    function loadLeadsFromServer() {
      fetch("/get-leads")
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success" && data.leads) {
            // Merge with local leads
            const serverLeads = data.leads;
            const localLeads = loadSavedLeads();

            // Create a map of existing leads by ID
            const leadMap = {};
            localLeads.forEach((lead) => {
              leadMap[lead.id] = lead;
            });

            // Add or update with server leads
            serverLeads.forEach((lead) => {
              leadMap[lead.id] = lead;
            });

            // Convert back to array
            savedLeads = Object.values(leadMap);

            // Save to localStorage
            localStorage.setItem("savedLeads", JSON.stringify(savedLeads));

            // If we're on the dashboard, refresh the table
            if (leadsDashboard.style.display === "block") {
              renderLeadsTable();
            }
          }
        })
        .catch((error) => {
          console.error("Error loading leads from server:", error);
        });
    }

    // Test CRM connection
    document.getElementById("test-connection").addEventListener("click", () => {
      const settings = {
        provider: document.getElementById("crm-provider").value,
        apiKey: document.getElementById("api-key").value,
        apiSecret: document.getElementById("api-secret").value,
        apiUrl: document.getElementById("api-url").value,
      };

      showNotification("Testing CRM connection...", "info");

      fetch("/test-crm-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            showNotification(
              `CRM connection successful: ${data.message}`,
              "success"
            );
          } else {
            showNotification(
              `CRM connection failed: ${data.message}`,
              "danger"
            );
          }
        })
        .catch((error) => {
          console.error("Error testing CRM connection:", error);
          showNotification(
            "Connection test failed. Please check your network.",
            "danger"
          );
        });
    });

    // Initial load
    loadLeadsFromServer();
  }

  // Initialize backend handlers
  initBackendHandlers();

  // Set up slider events for range inputs
  const minSlider = document.getElementById("score-range-min");
  const maxSlider = document.getElementById("score-range-max");
  const minDisplay = document.getElementById("score-min");
  const maxDisplay = document.getElementById("score-max");

  minSlider.addEventListener("input", () => {
    const minVal = parseInt(minSlider.value);
    const maxVal = parseInt(maxSlider.value);

    if (minVal > maxVal) {
      minSlider.value = maxVal;
      minDisplay.textContent = maxVal;
    } else {
      minDisplay.textContent = minVal;
    }
  });

  maxSlider.addEventListener("input", () => {
    const minVal = parseInt(minSlider.value);
    const maxVal = parseInt(maxSlider.value);

    if (maxVal < minVal) {
      maxSlider.value = minVal;
      maxDisplay.textContent = minVal;
    } else {
      maxDisplay.textContent = maxVal;
    }
  });

  // Function to update filters from UI
  function updateFilters() {
    // Lead tier
    const leadTier = [];
    if (document.getElementById("filter-hot").checked) leadTier.push("Hot");
    if (document.getElementById("filter-warm").checked) leadTier.push("Warm");
    if (document.getElementById("filter-nurture").checked)
      leadTier.push("Nurture");

    // AI score
    const minScore = parseInt(document.getElementById("score-range-min").value);
    const maxScore = parseInt(document.getElementById("score-range-max").value);

    // Tech focus
    const techFocus = [];
    if (document.getElementById("filter-ai-ml").checked)
      techFocus.push("ai_ml");
    if (document.getElementById("filter-data").checked) techFocus.push("data");
    if (document.getElementById("filter-cloud").checked)
      techFocus.push("cloud");
    if (document.getElementById("filter-integration").checked)
      techFocus.push("integration");

    // Company size
    const companySize = [];
    if (document.getElementById("filter-small").checked)
      companySize.push("Small");
    if (document.getElementById("filter-medium").checked)
      companySize.push("Medium");
    if (document.getElementById("filter-large").checked)
      companySize.push("Large");
    if (document.getElementById("filter-enterprise").checked)
      companySize.push("Enterprise");

    // Verification status
    const verificationStatus = [];
    if (document.getElementById("filter-verified").checked)
      verificationStatus.push("Verified");
    if (document.getElementById("filter-pending").checked)
      verificationStatus.push("Pending");
    if (document.getElementById("filter-flagged").checked)
      verificationStatus.push("Flagged");

    // Date added
    const dateAdded = document.getElementById("date-filter").value;

    // Custom date range
    const fromDate = document.getElementById("date-from").value;
    const toDate = document.getElementById("date-to").value;

    // Update applied filters
    appliedFilters = {
      leadTier,
      aiScore: [minScore, maxScore],
      techFocus,
      companySize,
      verificationStatus,
      dateAdded,
      customDateRange: {
        from: fromDate,
        to: toDate,
      },
    };

    // Reset to first page
    currentPage = 1;
  }

  // Function to reset filters
  function resetFilters() {
    // Reset checkboxes
    document.getElementById("filter-hot").checked = true;
    document.getElementById("filter-warm").checked = true;
    document.getElementById("filter-nurture").checked = true;

    document.getElementById("filter-ai-ml").checked = true;
    document.getElementById("filter-data").checked = true;
    document.getElementById("filter-cloud").checked = true;
    document.getElementById("filter-integration").checked = true;

    document.getElementById("filter-small").checked = true;
    document.getElementById("filter-medium").checked = true;
    document.getElementById("filter-large").checked = true;
    document.getElementById("filter-enterprise").checked = true;

    document.getElementById("filter-verified").checked = true;
    document.getElementById("filter-pending").checked = true;
    document.getElementById("filter-flagged").checked = true;

    // Reset range slider
    document.getElementById("score-range-min").value = 0;
    document.getElementById("score-range-max").value = 10;
    document.getElementById("score-min").textContent = 0;
    document.getElementById("score-max").textContent = 10;

    // Reset date filter
    document.getElementById("date-filter").value = "all";
    document.getElementById("custom-date-container").style.display = "none";
    document.getElementById("date-from").value = "";
    document.getElementById("date-to").value = "";

    // Reset applied filters
    appliedFilters = {
      leadTier: ["Hot", "Warm", "Nurture"],
      aiScore: [0, 10],
      techFocus: ["ai_ml", "data", "cloud", "integration"],
      companySize: ["Small", "Medium", "Large", "Enterprise"],
      verificationStatus: ["Verified", "Pending", "Flagged"],
      dateAdded: "all",
      customDateRange: {
        from: "",
        to: "",
      },
    };

    // Reset to first page
    currentPage = 1;

    // Update UI
    renderLeadsTable();
  }

  // Function to get selected leads
  function getSelectedLeads() {
    const selectedIds = Array.from(
      document.querySelectorAll(".lead-select-checkbox:checked")
    ).map((checkbox) => checkbox.getAttribute("data-id"));

    return savedLeads.filter((lead) => selectedIds.includes(lead.id));
  }

  // Function to get selected export fields
  function getSelectedExportFields() {
    const fields = {};

    // Company information
    fields.company = {
      name: document.getElementById("field-company-name").checked,
      website: document.getElementById("field-website").checked,
      size: document.getElementById("field-company-size").checked,
      industry: document.getElementById("field-industry").checked,
      location: document.getElementById("field-location").checked,
    };

    // Contact information
    fields.contact = {
      name: document.getElementById("field-contact-name").checked,
      title: document.getElementById("field-title").checked,
      email: document.getElementById("field-email").checked,
      phone: document.getElementById("field-phone").checked,
    };

    // Assessment data
    fields.assessment = {
      aiScore: document.getElementById("field-ai-score").checked,
      leadScore: document.getElementById("field-lead-score").checked,
      leadTier: document.getElementById("field-lead-tier").checked,
      techIndicators: document.getElementById("field-tech-indicators").checked,
      approach: document.getElementById("field-approach").checked,
      painPoints: document.getElementById("field-pain-points").checked,
    };

    // Verification data
    fields.verification = {
      status: document.getElementById("field-verification-status").checked,
      date: document.getElementById("field-verification-date").checked,
      notes: document.getElementById("field-verification-notes").checked,
    };

    return fields;
  }

  // Function to export selected leads
  function exportSelectedLeads(leads, format, fields) {
    // Simulate export
    showNotification(
      `Exporting ${leads.length} leads as ${format.toUpperCase()}...`,
      "info"
    );

    setTimeout(() => {
      // Create blob URL for download
      let content;
      let fileName;
      let mimeType;

      if (format === "csv") {
        content = generateCSV(leads, fields);
        fileName = "caprae_leads_export.csv";
        mimeType = "text/csv";
      } else if (format === "json") {
        content = generateJSON(leads, fields);
        fileName = "caprae_leads_export.json";
        mimeType = "application/json";
      } else if (format === "pdf") {
        // This would typically use a PDF library
        showNotification(
          "PDF export is not implemented in this demo",
          "warning"
        );
        hideExportModal();
        return;
      } else if (format === "xlsx") {
        // This would typically use an Excel library
        showNotification(
          "Excel export is not implemented in this demo",
          "warning"
        );
        hideExportModal();
        return;
      }

      // Create download link
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification(
        `Successfully exported ${leads.length
        } leads as ${format.toUpperCase()}`,
        "success"
      );
      hideExportModal();
    }, 1500);
  }

  // Function to email exported leads
  function emailExportedLeads(leads, format, fields, email, subject, message) {
    // Simulate email
    showNotification(`Sending export to ${email}...`, "info");

    setTimeout(() => {
      showNotification(`Export successfully sent to ${email}`, "success");
      hideExportModal();
    }, 1500);
  }

  // Function to generate CSV
  function generateCSV(leads, fields) {
    let csv = "";

    // Generate header row
    const headers = [];

    if (fields.company.name) headers.push("Company Name");
    if (fields.company.website) headers.push("Website");
    if (fields.company.size) headers.push("Company Size");
    if (fields.company.industry) headers.push("Industry");
    if (fields.company.location) headers.push("Location");

    if (fields.contact.name) headers.push("Contact Name");
    if (fields.contact.title) headers.push("Contact Title");
    if (fields.contact.email) headers.push("Contact Email");
    if (fields.contact.phone) headers.push("Contact Phone");

    if (fields.assessment.aiScore) headers.push("AI Readiness Score");
    if (fields.assessment.leadScore) headers.push("Lead Score");
    if (fields.assessment.leadTier) headers.push("Lead Tier");
    if (fields.assessment.techIndicators) headers.push("Technology Indicators");
    if (fields.assessment.approach) headers.push("Recommended Approach");
    if (fields.assessment.painPoints) headers.push("Pain Points");

    if (fields.verification.status) headers.push("Verification Status");
    if (fields.verification.date) headers.push("Verification Date");
    if (fields.verification.notes) headers.push("Verification Notes");

    csv += headers.join(",") + "\n";

    // Generate rows for each lead
    leads.forEach((lead) => {
      const row = [];

      if (fields.company.name) row.push(`"${lead.company_name || ""}"`);
      if (fields.company.website) row.push(`"${lead.url || ""}"`);
      if (fields.company.size)
        row.push(`"${lead.company_size_indicator || ""}"`);
      if (fields.company.industry) row.push(`"Software & Technology"`); // Placeholder
      if (fields.company.location) row.push(`"San Francisco, CA"`); // Placeholder

      const contact = lead.sales_insights?.primary_contact || {};
      if (fields.contact.name) row.push(`"${contact.name || ""}"`);
      if (fields.contact.title) row.push(`"${contact.title || ""}"`);
      if (fields.contact.email) row.push(`"${contact.email || ""}"`);
      if (fields.contact.phone) row.push(`"${contact.phone || ""}"`);

      if (fields.assessment.aiScore) row.push(lead.ai_readiness_score || 0);
      if (fields.assessment.leadScore)
        row.push(lead.sales_insights?.lead_score || 0);
      if (fields.assessment.leadTier)
        row.push(`"${lead.sales_insights?.lead_tier || ""}"`);

      // Compile tech indicators
      if (fields.assessment.techIndicators) {
        const techIndicators = [];
        if (lead.tech_indicators) {
          for (const category in lead.tech_indicators) {
            for (const indicator in lead.tech_indicators[category].indicators) {
              techIndicators.push(indicator);
            }
          }
        }
        row.push(`"${techIndicators.join(", ")}"`);
      }

      if (fields.assessment.approach) {
        const approach =
          lead.sales_insights?.outreach_recommendation?.approach?.focus || "";
        row.push(`"${approach}"`);
      }

      if (fields.assessment.painPoints) {
        const painPoints = lead.sales_insights?.pain_points || [];
        row.push(`"${painPoints.join(", ")}"`);
      }

      if (fields.verification.status)
        row.push(`"${lead.verification?.status || "Pending"}"`);
      if (fields.verification.date)
        row.push(`"${lead.verification?.date || ""}"`);
      if (fields.verification.notes)
        row.push(`"${lead.verification?.notes || ""}"`);

      csv += row.join(",") + "\n";
    });

    return csv;
  }

  // Function to generate JSON
  function generateJSON(leads, fields) {
    // Filter lead data based on selected fields
    const filteredLeads = leads.map((lead) => {
      const filteredLead = {};

      // Company information
      filteredLead.company = {};
      if (fields.company.name) filteredLead.company.name = lead.company_name;
      if (fields.company.website) filteredLead.company.website = lead.url;
      if (fields.company.size)
        filteredLead.company.size = lead.company_size_indicator;
      if (fields.company.industry)
        filteredLead.company.industry = "Software & Technology"; // Placeholder
      if (fields.company.location)
        filteredLead.company.location = "San Francisco, CA"; // Placeholder

      // Contact information
      filteredLead.contact = {};
      const contact = lead.sales_insights?.primary_contact || {};
      if (fields.contact.name) filteredLead.contact.name = contact.name;
      if (fields.contact.title) filteredLead.contact.title = contact.title;
      if (fields.contact.email) filteredLead.contact.email = contact.email;
      if (fields.contact.phone) filteredLead.contact.phone = contact.phone;

      // Assessment data
      filteredLead.assessment = {};
      if (fields.assessment.aiScore)
        filteredLead.assessment.aiReadinessScore = lead.ai_readiness_score;
      if (fields.assessment.leadScore)
        filteredLead.assessment.leadScore = lead.sales_insights?.lead_score;
      if (fields.assessment.leadTier)
        filteredLead.assessment.leadTier = lead.sales_insights?.lead_tier;

      // Tech indicators
      if (fields.assessment.techIndicators) {
        filteredLead.assessment.techIndicators = [];
        if (lead.tech_indicators) {
          for (const category in lead.tech_indicators) {
            for (const indicator in lead.tech_indicators[category].indicators) {
              filteredLead.assessment.techIndicators.push(indicator);
            }
          }
        }
      }

      if (fields.assessment.approach) {
        filteredLead.assessment.recommendedApproach =
          lead.sales_insights?.outreach_recommendation?.approach?.focus;
      }

      if (fields.assessment.painPoints) {
        filteredLead.assessment.painPoints =
          lead.sales_insights?.pain_points || [];
      }

      // Verification data
      filteredLead.verification = {};
      if (fields.verification.status)
        filteredLead.verification.status =
          lead.verification?.status || "Pending";
      if (fields.verification.date)
        filteredLead.verification.date = lead.verification?.date;
      if (fields.verification.notes)
        filteredLead.verification.notes = lead.verification?.notes;

      return filteredLead;
    });

    return JSON.stringify(filteredLeads, null, 2);
  }

  // Helper function to show notification
  function showNotification(message, type = "info") {
    // Check if notification container exists
    let notificationContainer = document.querySelector(
      ".notification-container"
    );
    if (!notificationContainer) {
      // Create notification container
      notificationContainer = document.createElement("div");
      notificationContainer.className = "notification-container";
      document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;

    // Set icon based on type
    let icon;
    switch (type) {
      case "success":
        icon = "fa-check-circle";
        break;
      case "warning":
        icon = "fa-exclamation-triangle";
        break;
      case "danger":
        icon = "fa-exclamation-circle";
        break;
      default:
        icon = "fa-info-circle";
    }

    // Set notification content
    notification.innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${message}</span>
      <button class="notification-close"><i class="fas fa-times"></i></button>
    `;

    // Add to container
    notificationContainer.appendChild(notification);

    // Add close event
    notification
      .querySelector(".notification-close")
      .addEventListener("click", () => {
        notification.classList.add("notification-hide");
        setTimeout(() => {
          notification.remove();
        }, 300);
      });

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add("notification-hide");
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }

  // Function to load saved leads from localStorage
  function loadSavedLeads() {
    const savedLeadsJSON = localStorage.getItem("savedLeads");
    return savedLeadsJSON ? JSON.parse(savedLeadsJSON) : [];
  }

  // Function to load saved CRM settings
  function loadSavedSettings() {
    const settings = JSON.parse(localStorage.getItem("crmSettings")) || {};

    // Populate form fields with saved settings
    document.getElementById("crm-provider").value =
      settings.provider || "salesforce";
    document.getElementById("api-key").value = settings.apiKey || "";
    document.getElementById("api-secret").value = settings.apiSecret || "";
    document.getElementById("api-url").value = settings.apiUrl || "";
    document.getElementById("auto-sync").checked =
      settings.autoSync !== undefined ? settings.autoSync : true;
    document.getElementById("sync-updates").checked =
      settings.syncUpdates !== undefined ? settings.syncUpdates : true;
    document.getElementById("bi-directional-sync").checked =
      settings.biDirectional || false;
    document.getElementById("sync-frequency").value =
      settings.syncFrequency || "realtime";

    // Show/hide custom fields if provider is "custom"
    if (settings.provider === "custom") {
      document.getElementById("custom-fields").style.display = "block";
    }
  }

  // Function to sync leads to CRM
  function syncLeadsToCRM(leads) {
    showNotification(`Syncing ${leads.length} leads to CRM...`, "info");

    // Simulate CRM sync process
    setTimeout(() => {
      // Update CRM status for each lead
      leads.forEach((lead) => {
        const leadIndex = savedLeads.findIndex((l) => l.id === lead.id);
        if (leadIndex !== -1) {
          savedLeads[leadIndex].crm = {
            status: "Synced",
            date: new Date().toISOString(),
          };
        }
      });

      // Save updated leads to localStorage
      localStorage.setItem("savedLeads", JSON.stringify(savedLeads));

      // Refresh the table
      renderLeadsTable();

      showNotification(
        `Successfully synced ${leads.length} leads to CRM`,
        "success"
      );
    }, 2000);
  }

  // Function to sync a single lead to CRM
  function syncLeadToCRM(lead) {
    showNotification(`Syncing lead "${lead.company_name}" to CRM...`, "info");

    // Simulate CRM sync process
    setTimeout(() => {
      // Update CRM status
      const leadIndex = savedLeads.findIndex((l) => l.id === lead.id);
      if (leadIndex !== -1) {
        savedLeads[leadIndex].crm = {
          status: "Synced",
          date: new Date().toISOString(),
        };

        // Save updated leads to localStorage
        localStorage.setItem("savedLeads", JSON.stringify(savedLeads));

        // Refresh the table
        renderLeadsTable();

        showNotification(
          `Successfully synced "${lead.company_name}" to CRM`,
          "success"
        );
      }
    }, 1500);
    if (fields.contact.name) filterLeads.contact.name = contact.name;
    if (fields.contact.title) filterLeads.contact.title = contact.title;
    if (fields.contact.email) filterLeads.contact.email = contact.email;
    if (fields.contact.phone) filterLeads.contact.phone = contact.phone;
  }
});