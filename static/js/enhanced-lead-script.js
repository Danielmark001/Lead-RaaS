document.addEventListener("DOMContentLoaded", () => {
  // Element references for main functionality
  const urlInput = document.getElementById("url-input");
  const analyzeBtn = document.getElementById("analyze-btn");
  const loadingElement = document.getElementById("loading");
  const resultsSection = document.getElementById("results-section");
  const resultsElement = document.getElementById("results");
  const resultsTemplate = document.getElementById("results-template");
  const leadTemplate = document.getElementById("lead-insights-template");
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
  let savedLeads = initializeSampleLeads();
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
  // Auto-display the dashboard on page load
  document.addEventListener("DOMContentLoaded", () => {
    // Wait a moment for everything to initialize
    setTimeout(() => {
      showLeadsDashboard();
    }, 500);
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

    // Add Investment Criteria Match if available
    if (data.investment_match) {
      try {
        displayInvestmentMatch(data.investment_match);
        console.log("Investment match data displayed");
      } catch (error) {
        console.error("Error displaying investment match:", error);
      }
    }

    // Animate score count up
    animateScoreCount(".score-value", data.ai_readiness_score);

    // Animate lead score if available
    if (data.sales_insights) {
      animateScoreCount(".lead-score-value", data.sales_insights.lead_score);
    }
  }

  // Function to display investment match data
  function displayInvestmentMatch(matchData) {
    console.log("Displaying investment match data:", matchData);

    // Create investment match section
    const matchSection = document.createElement("div");
    matchSection.className = "dashboard-section";

    // Create header
    const header = document.createElement("div");
    header.className = "section-header";
    header.innerHTML =
      '<i class="fas fa-chart-bar"></i><h3>Investment Criteria Match</h3>';
    matchSection.appendChild(header);

    // Create content container
    const content = document.createElement("div");
    content.className = "investment-match-container";
    content.style.padding = "1.5rem";

    // Calculate score and get match tier
    const overallMatch = Math.round(matchData.overall_match || 0);
    const matchTier = matchData.match_tier || "Unknown";
    const confidence = Math.round(matchData.confidence || 0);

    // Get appropriate colors based on score
    const scoreColor = getScoreColor(overallMatch);

    // Create score overview
    const scoreOverview = document.createElement("div");
    scoreOverview.className = "score-overview";
    scoreOverview.style.display = "flex";
    scoreOverview.style.flexDirection = "column";
    scoreOverview.style.alignItems = "center";
    scoreOverview.style.marginBottom = "2rem";

    // Create score ring
    const scoreHtml = `
      <div class="score-card" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 1rem;">
        <div class="score-ring" style="width: 120px; height: 120px; border-radius: 50%; background-color: ${scoreColor}25; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-bottom: 1rem;">
          <div class="investment-score" id="investment-score" style="font-size: 3rem; font-weight: 700; color: ${scoreColor};">0</div>
          <div class="score-max" style="font-size: 1.25rem; color: ${scoreColor}80;">%</div>
        </div>
        <div class="score-label" style="font-size: 1.25rem; font-weight: 600;">Investment Fit</div>
      </div>
      
      <div style="display: flex; align-items: center; padding: 0.5rem 1rem; background-color: #f1f5f9; border-radius: 8px; margin-top: 0.5rem;">
        <span style="font-weight: 600; margin-right: 0.5rem;">Match Tier:</span>
        <span style="color: ${scoreColor}; font-weight: 500;">${matchTier}</span>
      </div>
      
      <div style="display: flex; align-items: center; padding: 0.5rem 1rem; background-color: #f1f5f9; border-radius: 8px; margin-top: 0.5rem;">
        <span style="font-weight: 600; margin-right: 0.5rem;">Confidence:</span>
        <span>${confidence}%</span>
      </div>
    `;

    scoreOverview.innerHTML = scoreHtml;
    content.appendChild(scoreOverview);

    // Create criteria breakdown
    const breakdownSection = document.createElement("div");
    breakdownSection.style.marginTop = "2rem";

    // Create breakdown header
    const breakdownHeader = document.createElement("h4");
    breakdownHeader.style.marginBottom = "1rem";
    breakdownHeader.style.paddingBottom = "0.5rem";
    breakdownHeader.style.borderBottom = "1px solid #e2e8f0";
    breakdownHeader.textContent = "Criteria Breakdown";
    breakdownSection.appendChild(breakdownHeader);

    // Create breakdown charts
    const breakdownCharts = document.createElement("div");
    breakdownCharts.style.display = "flex";
    breakdownCharts.style.flexDirection = "column";
    breakdownCharts.style.gap = "1rem";

    // Business criteria
    const businessScore = Math.round(matchData.business_criteria?.score || 0);
    const businessColor = getScoreColor(businessScore);

    const businessChart = `
      <div style="display: flex; align-items: center">
        <span style="width: 150px; font-weight: 500">Business Criteria</span>
        <div style="flex: 1; height: 10px; background-color: #e2e8f0; border-radius: 5px; overflow: hidden; margin-right: 10px">
          <div style="height: 100%; width: ${businessScore}%; background-color: ${businessColor}; border-radius: 5px"></div>
        </div>
        <span style="font-weight: 500; min-width: 45px; text-align: right">${businessScore}%</span>
      </div>
    `;

    // Industry criteria
    const industryScore = Math.round(matchData.industry_criteria?.score || 0);
    const industryColor = getScoreColor(industryScore);

    const industryChart = `
      <div style="display: flex; align-items: center">
        <span style="width: 150px; font-weight: 500">Industry Criteria</span>
        <div style="flex: 1; height: 10px; background-color: #e2e8f0; border-radius: 5px; overflow: hidden; margin-right: 10px">
          <div style="height: 100%; width: ${industryScore}%; background-color: ${industryColor}; border-radius: 5px"></div>
        </div>
        <span style="font-weight: 500; min-width: 45px; text-align: right">${industryScore}%</span>
      </div>
    `;

    // Financial criteria
    const financialScore = Math.round(matchData.financial_criteria?.score || 0);
    const financialColor = getScoreColor(financialScore);

    const financialChart = `
      <div style="display: flex; align-items: center">
        <span style="width: 150px; font-weight: 500">Financial Criteria</span>
        <div style="flex: 1; height: 10px; background-color: #e2e8f0; border-radius: 5px; overflow: hidden; margin-right: 10px">
          <div style="height: 100%; width: ${financialScore}%; background-color: ${financialColor}; border-radius: 5px"></div>
        </div>
        <span style="font-weight: 500; min-width: 45px; text-align: right">${financialScore}%</span>
      </div>
    `;

    breakdownCharts.innerHTML = businessChart + industryChart + financialChart;
    breakdownSection.appendChild(breakdownCharts);
    content.appendChild(breakdownSection);

    // Create strengths and concerns section
    const strengthsConcerns = document.createElement("div");
    strengthsConcerns.style.display = "grid";
    strengthsConcerns.style.gridTemplateColumns = "1fr 1fr";
    strengthsConcerns.style.gap = "1.5rem";
    strengthsConcerns.style.marginTop = "2rem";

    // Strengths section
    const strengths = document.createElement("div");

    const strengthsHeader = document.createElement("h4");
    strengthsHeader.style.marginBottom = "1rem";
    strengthsHeader.style.paddingBottom = "0.5rem";
    strengthsHeader.style.borderBottom = "1px solid #e2e8f0";
    strengthsHeader.textContent = "Key Strengths";
    strengths.appendChild(strengthsHeader);

    const strengthsList = document.createElement("ul");
    strengthsList.style.listStyle = "none";
    strengthsList.style.padding = "0";

    if (matchData.key_strengths && matchData.key_strengths.length > 0) {
      matchData.key_strengths.forEach((strength) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.alignItems = "flex-start";
        li.style.padding = "0.75rem";
        li.style.backgroundColor = "#f1f5f9";
        li.style.borderRadius = "8px";
        li.style.marginBottom = "0.75rem";
        li.style.fontSize = "0.95rem";
        li.innerHTML = `<i class="fas fa-check-circle" style="color: #10b981; margin-right: 0.75rem; margin-top: 0.25rem"></i>${strength}`;
        strengthsList.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.style.fontStyle = "italic";
      li.style.color = "#64748b";
      li.textContent = "No key strengths identified yet";
      strengthsList.appendChild(li);
    }

    strengths.appendChild(strengthsList);
    strengthsConcerns.appendChild(strengths);

    // Concerns section
    const concerns = document.createElement("div");

    const concernsHeader = document.createElement("h4");
    concernsHeader.style.marginBottom = "1rem";
    concernsHeader.style.paddingBottom = "0.5rem";
    concernsHeader.style.borderBottom = "1px solid #e2e8f0";
    concernsHeader.textContent = "Key Concerns";
    concerns.appendChild(concernsHeader);

    const concernsList = document.createElement("ul");
    concernsList.style.listStyle = "none";
    concernsList.style.padding = "0";

    if (matchData.key_concerns && matchData.key_concerns.length > 0) {
      matchData.key_concerns.forEach((concern) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.alignItems = "flex-start";
        li.style.padding = "0.75rem";
        li.style.backgroundColor = "#f1f5f9";
        li.style.borderRadius = "8px";
        li.style.marginBottom = "0.75rem";
        li.style.fontSize = "0.95rem";
        li.innerHTML = `<i class="fas fa-exclamation-circle" style="color: #ef4444; margin-right: 0.75rem; margin-top: 0.25rem"></i>${concern}`;
        concernsList.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.style.fontStyle = "italic";
      li.style.color = "#64748b";
      li.textContent = "No key concerns identified yet";
      concernsList.appendChild(li);
    }

    concerns.appendChild(concernsList);
    strengthsConcerns.appendChild(concerns);

    content.appendChild(strengthsConcerns);

    // Add data completeness section if available
    if (matchData.data_completeness) {
      const completeness = matchData.data_completeness;

      const completenessSection = document.createElement("div");
      completenessSection.style.marginTop = "2rem";

      const completenessHeader = document.createElement("h4");
      completenessHeader.style.marginBottom = "1rem";
      completenessHeader.style.paddingBottom = "0.5rem";
      completenessHeader.style.borderBottom = "1px solid #e2e8f0";
      completenessHeader.textContent = "Data Completeness";
      completenessSection.appendChild(completenessHeader);

      const completenessCharts = document.createElement("div");
      completenessCharts.style.display = "flex";
      completenessCharts.style.flexDirection = "column";
      completenessCharts.style.gap = "1rem";

      // Financial data completeness
      const financialCompleteness = Math.round(completeness.financial || 0);
      const financialCompleteColor = getCompletenessColor(
        financialCompleteness
      );

      const financialChart = `
        <div style="display: flex; align-items: center">
          <span style="width: 150px; font-weight: 500">Financial Data</span>
          <div style="flex: 1; height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden; margin-right: 10px">
            <div style="height: 100%; width: ${financialCompleteness}%; background-color: ${financialCompleteColor}; border-radius: 4px"></div>
          </div>
          <span style="font-weight: 500; min-width: 45px; text-align: right">${financialCompleteness}%</span>
        </div>
      `;

      // Business data completeness
      const businessCompleteness = Math.round(completeness.business || 0);
      const businessCompleteColor = getCompletenessColor(businessCompleteness);

      const businessChart = `
        <div style="display: flex; align-items: center">
          <span style="width: 150px; font-weight: 500">Business Data</span>
          <div style="flex: 1; height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden; margin-right: 10px">
            <div style="height: 100%; width: ${businessCompleteness}%; background-color: ${businessCompleteColor}; border-radius: 4px"></div>
          </div>
          <span style="font-weight: 500; min-width: 45px; text-align: right">${businessCompleteness}%</span>
        </div>
      `;

      // Industry data completeness
      const industryCompleteness = Math.round(completeness.industry || 0);
      const industryCompleteColor = getCompletenessColor(industryCompleteness);

      const industryChart = `
        <div style="display: flex; align-items: center">
          <span style="width: 150px; font-weight: 500">Industry Data</span>
          <div style="flex: 1; height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden; margin-right: 10px">
            <div style="height: 100%; width: ${industryCompleteness}%; background-color: ${industryCompleteColor}; border-radius: 4px"></div>
          </div>
          <span style="font-weight: 500; min-width: 45px; text-align: right">${industryCompleteness}%</span>
        </div>
      `;

      completenessCharts.innerHTML =
        financialChart + businessChart + industryChart;
      completenessSection.appendChild(completenessCharts);

      content.appendChild(completenessSection);
    }

    // Add the content to the section
    matchSection.appendChild(content);

    // Add the section to the results
    resultsElement.appendChild(matchSection);

    // Animate the investment score
    animateScoreCount("#investment-score", overallMatch);
  }

  // Helper function to get score color
  function getScoreColor(score) {
    if (score >= 80) {
      return "#10b981"; // green
    } else if (score >= 60) {
      return "#3b82f6"; // blue
    } else if (score >= 40) {
      return "#f59e0b"; // yellow/orange
    } else {
      return "#ef4444"; // red
    }
  }

  // Helper function to get completeness color
  function getCompletenessColor(value) {
    if (value >= 80) {
      return "#10b981"; // green
    } else if (value >= 50) {
      return "#f59e0b"; // yellow/orange
    } else {
      return "#ef4444"; // red
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
  // Add this directly to your JavaScript file
  // Add this directly to your JavaScript file
  document.querySelector("#save-lead").addEventListener("click", function () {
    if (lastAnalysisData) {
      try {
        // Generate unique ID
        const id = `lead_${Date.now()}`;

        // Create lead object
        const lead = {
          id,
          url: urlInput.value,
          company_name: lastAnalysisData.company_name || "Unknown Company",
          date_added: new Date().toISOString(),
          ai_readiness_score: lastAnalysisData.ai_readiness_score,
          sales_insights: lastAnalysisData.sales_insights,
        };

        // Add to saved leads array
        savedLeads.push(lead);

        // Save to localStorage
        localStorage.setItem("savedLeads", JSON.stringify(savedLeads));

        console.log("Lead saved:", lead);
        showNotification("Lead saved successfully!", "success");
      } catch (e) {
        console.error("Error saving lead:", e);
        showNotification("Failed to save lead: " + e.message, "danger");
      }
    } else {
      showNotification("No lead data available to save", "warning");
    }
  });
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
    document.getElementById("ai-score-value").textContent = `${
      lead.ai_readiness_score || 0
    } / 10`;

    // Fill lead score and tier
    if (lead.sales_insights) {
      document.getElementById("lead-score-value").textContent = `${
        lead.sales_insights.lead_score || 0
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
    // Set lead ID for reference
    verificationPanel.setAttribute("data-lead-id", lead.id);

    // Add financial details if available
    if (lead.financials) {
      const financials = lead.financials;

      // Fill in financial details if the fields exist
      const revenueField = document.getElementById("estimated-revenue-value");
      if (revenueField && financials.estimated_revenue) {
        revenueField.textContent = formatCurrency(financials.estimated_revenue);
      }

      const recurringField = document.getElementById("recurring-revenue-value");
      if (recurringField && financials.recurring_revenue_percentage) {
        recurringField.textContent = `${financials.recurring_revenue_percentage}%`;
      }

      const cashFlowField = document.getElementById("annual-cash-flow-value");
      if (cashFlowField && financials.estimated_annual_cash_flow) {
        cashFlowField.textContent = formatCurrency(
          financials.estimated_annual_cash_flow
        );
      }

      const profitabilityField = document.getElementById(
        "profitability-years-value"
      );
      if (profitabilityField && financials.profitability_years) {
        profitabilityField.textContent = financials.profitability_years;
      }

      const ebitdaField = document.getElementById("ebitda-margin-value");
      if (ebitdaField && financials.ebitda_margin) {
        ebitdaField.textContent = `${financials.ebitda_margin}%`;
      }

      const capexField = document.getElementById("capex-requirements-value");
      if (capexField && financials.capex_requirements) {
        capexField.textContent = financials.capex_requirements;
      }
    }

    // Add business details if available
    if (lead.business_details) {
      const business = lead.business_details;

      // Fill in business details if the fields exist
      const marketPositionField = document.getElementById(
        "market-position-value"
      );
      if (marketPositionField && business.market_position) {
        marketPositionField.textContent = formatFieldValue(
          business.market_position
        );
      }

      const customerDiversityField = document.getElementById(
        "customer-diversity-value"
      );
      if (customerDiversityField && business.customer_diversity) {
        customerDiversityField.textContent = formatFieldValue(
          business.customer_diversity
        );
      }

      const operationsField = document.getElementById(
        "operations-complexity-value"
      );
      if (operationsField && business.operations_complexity) {
        operationsField.textContent = formatFieldValue(
          business.operations_complexity
        );
      }

      const managementField = document.getElementById(
        "management-strength-value"
      );
      if (managementField && business.middle_management_strength) {
        managementField.textContent = formatFieldValue(
          business.middle_management_strength
        );
      }

      const ownerField = document.getElementById("owner-status-value");
      if (ownerField && business.owner_status) {
        ownerField.textContent = formatFieldValue(business.owner_status);
      }
    }

    // Add industry details if available
    if (lead.industry_details) {
      const industry = lead.industry_details;

      // Fill in industry details if the fields exist
      const industryTypeField = document.getElementById("industry-type-value");
      if (industryTypeField && industry.industry_type) {
        industryTypeField.textContent = industry.industry_type;
      }

      const revenueModelField = document.getElementById("revenue-model-value");
      if (revenueModelField && industry.recurring_revenue_model) {
        revenueModelField.textContent = formatFieldValue(
          industry.recurring_revenue_model
        );
      }

      const b2bField = document.getElementById("b2b-percentage-value");
      if (b2bField && industry.b2b_percentage) {
        b2bField.textContent = `${industry.b2b_percentage}%`;
      }

      const competitiveField = document.getElementById(
        "competitive-landscape-value"
      );
      if (competitiveField && industry.competitive_landscape) {
        competitiveField.textContent = formatFieldValue(
          industry.competitive_landscape
        );
      }

      const marketSizeField = document.getElementById("market-size-value");
      if (marketSizeField && industry.total_market_size) {
        marketSizeField.textContent = `$${(
          industry.total_market_size / 1000000000
        ).toFixed(1)}B`;
      }

      const growthField = document.getElementById("market-growth-value");
      if (growthField && industry.market_growth_rate) {
        growthField.textContent = `${industry.market_growth_rate}%`;
      }
    }

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
    ).textContent = `Export ${selectedCount} Lead${
      selectedCount !== 1 ? "s" : ""
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
      // Include investment match data if available
      investment_match: data.investment_match || null,
      // Include financial data if available
      financials: data.financials || null,
      business_details: data.business_details || null,
      industry_details: data.industry_details || null,
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
        <td colspan="9" class="empty-table">
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

        // Create investment match badge
        let investmentBadge = "";
        if (lead.investment_match) {
          const matchScore = Math.round(
            lead.investment_match.overall_match || 0
          );
          const matchTier = lead.investment_match.match_tier || "Unknown";
          const matchClass =
            matchTier === "Strong Match"
              ? "match-strong"
              : matchTier === "Potential Match"
              ? "match-potential"
              : matchTier === "Partial Match"
              ? "match-partial"
              : "match-weak";

          investmentBadge = `
            <span class="match-indicator ${matchClass}">
              <i class="fas fa-chart-bar"></i> ${matchScore}% ${matchTier}
            </span>
          `;
        } else {
          investmentBadge = `<span class="empty-contact">Not evaluated</span>`;
        }

        // Create row HTML
        row.innerHTML = `
          <td><input type="checkbox" class="lead-select-checkbox" data-id="${lead.id}"></td>
          <td>${lead.company_name}</td>
          <td>${lead.ai_readiness_score}</td>
          <td>${tierBadge}</td>
          <td>${contactDisplay}</td>
          <td>${investmentBadge}</td>
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
        case "investment":
          aValue = a.investment_match?.overall_match || 0;
          bValue = b.investment_match?.overall_match || 0;
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
      
      /* Investment match styles */
      .match-indicator {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 600;
      }
      
      .match-strong {
        background-color: rgba(16, 185, 129, 0.1);
        color: #10b981;
      }
      
      .match-potential {
        background-color: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }
      
      .match-partial {
        background-color: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }
      
      .match-weak {
        background-color: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }
    `;
    document.head.appendChild(style);
  }

  // Call to add notification styles
  addNotificationStyles();

  localStorage.removeItem("savedLeads");

  // Helper function to get selected leads
  function getSelectedLeads() {
    const selectedIds = Array.from(
      document.querySelectorAll(".lead-select-checkbox:checked")
    ).map((checkbox) => checkbox.getAttribute("data-id"));

    return savedLeads.filter((lead) => selectedIds.includes(lead.id));
  }

  // Helper function to get selected export fields
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
      investmentMatch: document.getElementById("field-investment-match")
        .checked,
    };

    // Verification data
    fields.verification = {
      status: document.getElementById("field-verification-status").checked,
      date: document.getElementById("field-verification-date").checked,
      notes: document.getElementById("field-verification-notes").checked,
    };

    return fields;
  }

  // Helper function to format currency
  function formatCurrency(amount) {
    if (amount === null || amount === undefined) return "Unknown";

    // Format as currency
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return formatter.format(amount);
  }

  // Helper function to format field value (capitalize first letter of each word)
  function formatFieldValue(value) {
    if (!value) return "Unknown";

    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

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
  }

  // Initialize sample leads data
  // Initialize sample leads data
  function initializeSampleLeads() {
    // Check if we already have leads saved
    const existingLeads = localStorage.getItem("savedLeads");
    if (existingLeads && JSON.parse(existingLeads).length > 0) {
      console.log("Using existing saved leads");
      return JSON.parse(existingLeads);
    }

    // Create sample leads
    const sampleLeads = [
      {
        id: "lead_1679012345678",
        url: "https://netflix.com",
        company_name: "Netflix",
        date_added: new Date(
          Date.now() - 15 * 24 * 60 * 60 * 1000
        ).toISOString(), // 15 days ago
        ai_readiness_score: 9.2,
        company_size_indicator: "Enterprise (1000+ employees)",
        tech_indicators: {
          ai_ml: {
            total: 6,
            indicators: {
              "Machine Learning": 4,
              "Recommendation Systems": 5,
              "Personalization AI": 3,
              "Computer Vision": 2,
              "Natural Language Processing": 3,
              "Predictive Analytics": 4,
            },
          },
          data: {
            total: 4,
            indicators: {
              "Big Data": 5,
              "Data Warehousing": 4,
              "Data Streaming": 5,
              "Apache Kafka": 3,
            },
          },
          cloud: {
            total: 3,
            indicators: {
              AWS: 4,
              "Cloud Migration": 3,
              "Cloud-Native": 5,
            },
          },
        },
        leadership_team: [
          { name: "Ted Sarandos", title: "Co-CEO" },
          { name: "Greg Peters", title: "Co-CEO" },
          { name: "Marian Lee", title: "Chief Marketing Officer" },
        ],
        sales_insights: {
          lead_score: 92,
          lead_tier: "Hot",
          primary_contact: {
            name: "Alex Rivera",
            title: "VP of Data Engineering",
            email: "alex.rivera@example.com",
            phone: "+1-555-923-4567",
          },
          pain_points: [
            "Content recommendation optimization",
            "Scaling ML infrastructure",
            "Improving predictions for viewer retention",
          ],
          outreach_recommendation: {
            timing: "Immediate",
            approach: {
              focus: "ML Infrastructure Optimization",
              message: "Value-focused",
              conversation_starters: [
                "Your recent investment in machine learning suggests you might be looking to scale your ML operations",
                "How are you currently addressing the challenge of real-time recommendation systems?",
                "We've helped similar companies reduce ML training costs by 40%",
              ],
            },
          },
          score_components: {
            decision_maker_score: 9.5,
            tech_investment_score: 9.2,
            growth_score: 8.8,
            ai_readiness_factor: 9.5,
          },
        },
        verification: {
          status: "Verified",
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          notes:
            "Verified contact information through LinkedIn. Company is actively hiring for AI/ML roles.",
        },
        crm: {
          status: "Synced",
          date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          crm_id: "CRM_NF123456",
        },
        investment_match: {
          overall_match: 32.5,
          match_tier: "Weak Match",
          confidence: 75,
          business_criteria: { score: 45 },
          industry_criteria: { score: 30 },
          financial_criteria: { score: 25 },
          key_strengths: ["Strong technical team", "Innovative culture"],
          key_concerns: [
            "Revenue above target range (>$50M)",
            "EBITDA margin below target",
            "High capital requirements",
            "Not a service-based business model",
          ],
          data_completeness: {
            financial: 80,
            business: 60,
            industry: 70,
          },
        },
        financials: {
          estimated_revenue: 25000000000, // $25B
          recurring_revenue_percentage: 95,
          estimated_annual_cash_flow: 5000000000, // $5B
          profitability_years: 10,
          ebitda_margin: 12,
          capex_requirements: "high",
        },
        business_details: {
          market_position: "strong",
          customer_diversity: "diverse",
          operations_complexity: "complex",
          middle_management_strength: "strong",
          owner_status: "public",
        },
        industry_details: {
          industry_type: "Entertainment & Media",
          recurring_revenue_model: "strong",
          b2b_percentage: 5,
          competitive_landscape: "concentrated",
          total_market_size: 290000000000, // $290B
          market_growth_rate: 8.5,
        },
      },
      {
        id: "lead_1679012345679",
        url: "https://salesforce.com",
        company_name: "Salesforce",
        date_added: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 days ago
        ai_readiness_score: 8.7,
        company_size_indicator: "Enterprise (1000+ employees)",
        tech_indicators: {
          ai_ml: {
            total: 5,
            indicators: {
              "Einstein AI": 5,
              "Machine Learning": 4,
              "Predictive Analytics": 5,
              "Natural Language Processing": 3,
              "Automated ML": 2,
            },
          },
          data: {
            total: 4,
            indicators: {
              "Data Integration": 5,
              "Data Warehousing": 4,
              "Big Data": 3,
              "Data Lakes": 3,
            },
          },
          cloud: {
            total: 3,
            indicators: {
              SaaS: 5,
              "Cloud Platform": 5,
              "Multi-Cloud": 4,
            },
          },
        },
        leadership_team: [
          { name: "Marc Benioff", title: "CEO" },
          { name: "Brian Millham", title: "COO" },
          { name: "Bret Taylor", title: "Board Member" },
        ],
        sales_insights: {
          lead_score: 87,
          lead_tier: "Hot",
          primary_contact: {
            name: "Jordan Chen",
            title: "Director of AI Strategy",
            email: "jordan.chen@example.com",
            phone: "+1-555-783-2190",
          },
          pain_points: [
            "Einstein AI integration challenges",
            "AI model fairness and bias",
            "Customer data integration for ML",
          ],
          outreach_recommendation: {
            timing: "Immediate",
            approach: {
              focus: "Enterprise AI Ethics & Integration",
              message: "Solution-focused",
              conversation_starters: [
                "How are you addressing ethical concerns in your Einstein AI implementations?",
                "Are you facing challenges with enterprise-wide AI adoption?",
                "Our approach to AI governance has helped similar companies improve compliance by 35%",
              ],
            },
          },
          score_components: {
            decision_maker_score: 8.9,
            tech_investment_score: 9.1,
            growth_score: 8.5,
            ai_readiness_factor: 8.9,
          },
        },
        verification: {
          status: "Verified",
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          notes:
            "Confirmed company's AI initiatives through recent press releases and tech blog posts.",
        },
        crm: {
          status: "Synced",
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          crm_id: "CRM_SF789012",
        },
        investment_match: {
          overall_match: 36,
          match_tier: "Weak Match",
          confidence: 85,
          business_criteria: { score: 42 },
          industry_criteria: { score: 50 },
          financial_criteria: { score: 20 },
          key_strengths: [
            "Strong B2B focus",
            "Service-based business",
            "Strong recurring revenue",
          ],
          key_concerns: [
            "Revenue above target range (>$50M)",
            "Cash flow above target range (>$5M)",
            "Enterprise size too large for criteria",
          ],
          data_completeness: {
            financial: 90,
            business: 80,
            industry: 75,
          },
        },
        financials: {
          estimated_revenue: 21000000000, // $21B
          recurring_revenue_percentage: 90,
          estimated_annual_cash_flow: 4200000000, // $4.2B
          profitability_years: 20,
          ebitda_margin: 19,
          capex_requirements: "low",
        },
        business_details: {
          market_position: "strong",
          customer_diversity: "diverse",
          operations_complexity: "moderate",
          middle_management_strength: "strong",
          owner_status: "public",
        },
        industry_details: {
          industry_type: "Software & Technology",
          recurring_revenue_model: "strong",
          b2b_percentage: 95,
          competitive_landscape: "concentrated",
          total_market_size: 150000000000, // $150B
          market_growth_rate: 12,
        },
      },
      {
        id: "lead_1679012345683",
        url: "https://getcarecircle.com",
        company_name: "Care Circle",
        date_added: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(), // 5 days ago
        ai_readiness_score: 7.8,
        company_size_indicator: "Medium Business (50-250 employees)",
        tech_indicators: {
          ai_ml: {
            total: 3,
            indicators: {
              "Machine Learning": 3,
              "Predictive Analytics": 2,
              "Natural Language Processing": 1,
            },
          },
          data: {
            total: 4,
            indicators: {
              "Data Analytics": 3,
              "Healthcare Data": 4,
              "Data Security": 4,
              "Patient Records": 3,
            },
          },
          cloud: {
            total: 3,
            indicators: {
              "Cloud Infrastructure": 3,
              "HIPAA Compliance": 4,
              "Secure Storage": 3,
            },
          },
        },
        leadership_team: [
          { name: "Sarah Johnson", title: "CEO" },
          { name: "Michael Chen", title: "CTO" },
          { name: "Rebecca Garcia", title: "COO" },
        ],
        sales_insights: {
          lead_score: 81,
          lead_tier: "Warm",
          primary_contact: {
            name: "Michael Chen",
            title: "CTO",
            email: "mchen@careclrcle.com",
            phone: "+1-555-218-9034",
          },
          pain_points: [
            "Patient data integration",
            "Healthcare compliance",
            "Scaling technical infrastructure",
          ],
          outreach_recommendation: {
            timing: "Next Week",
            approach: {
              focus: "Healthcare AI Integration",
              message: "Value-focused",
              conversation_starters: [
                "How are you currently handling patient data integration across platforms?",
                "What challenges are you facing with HIPAA compliance in your AI initiatives?",
                "Our healthcare AI approach has helped similar startups improve patient outcomes by 30%",
              ],
            },
          },
          score_components: {
            decision_maker_score: 8.3,
            tech_investment_score: 8.0,
            growth_score: 8.2,
            ai_readiness_factor: 7.9,
          },
        },
        verification: {
          status: "Pending",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          notes: "Need to verify leadership team and funding status.",
        },
        crm: {
          status: "Queued",
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          crm_id: null,
        },
        investment_match: {
          overall_match: 87,
          match_tier: "Strong Match",
          confidence: 80,
          business_criteria: { score: 85 },
          industry_criteria: { score: 90 },
          financial_criteria: { score: 85 },
          key_strengths: [
            "Revenue in target range ($5-50M)",
            "Cash flow in target range ($1-5M)",
            "B2B service-based business",
            "Strong recurring revenue model",
            "Owner seeking growth capital",
          ],
          key_concerns: [
            "Healthcare regulatory constraints",
            "Verify financial performance details",
          ],
          data_completeness: {
            financial: 65,
            business: 75,
            industry: 85,
          },
        },
        financials: {
          estimated_revenue: 18000000, // $18M
          recurring_revenue_percentage: 85,
          estimated_annual_cash_flow: 3500000, // $3.5M
          profitability_years: 4,
          ebitda_margin: 19.5,
          capex_requirements: "low",
        },
        business_details: {
          market_position: "strong",
          customer_diversity: "moderate",
          operations_complexity: "straightforward",
          middle_management_strength: "strong",
          owner_status: "seeking_reduced_role",
        },
        industry_details: {
          industry_type: "Healthcare Technology",
          recurring_revenue_model: "strong",
          b2b_percentage: 80,
          competitive_landscape: "fragmented",
          total_market_size: 15000000000, // $15B
          market_growth_rate: 18,
        },
      },
      {
        id: "lead_1679012345687",
        url: "https://supplychainpro.com",
        company_name: "Supply Chain Pro",
        date_added: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(), // 2 days ago
        ai_readiness_score: 6.9,
        company_size_indicator: "Medium Business (50-250 employees)",
        tech_indicators: {
          ai_ml: {
            total: 3,
            indicators: {
              "Predictive Analytics": 3,
              "Forecasting Algorithms": 4,
              "Machine Learning": 2,
            },
          },
          data: {
            total: 5,
            indicators: {
              "Supply Chain Data": 5,
              "Inventory Management": 4,
              "Logistics Tracking": 5,
              "Vendor Management": 3,
              "Business Intelligence": 4,
            },
          },
          integration: {
            total: 4,
            indicators: {
              "ERP Integration": 5,
              "API Connections": 4,
              "Data Pipelines": 3,
              "Third-party Systems": 4,
            },
          },
        },
        leadership_team: [
          { name: "Robert Smith", title: "CEO" },
          { name: "Lisa Wong", title: "COO" },
          { name: "James Peterson", title: "CTO" },
        ],
        sales_insights: {
          lead_score: 76,
          lead_tier: "Warm",
          primary_contact: {
            name: "Robert Smith",
            title: "CEO",
            email: "robert@supplychainpro.com",
            phone: "+1-555-332-7789",
          },
          pain_points: [
            "Demand forecasting accuracy",
            "Supply chain visibility",
            "Vendor performance monitoring",
          ],
          outreach_recommendation: {
            timing: "This Week",
            approach: {
              focus: "Supply Chain Intelligence",
              message: "Efficiency-focused",
              conversation_starters: [
                "What challenges are you facing with demand forecasting in today's volatile market?",
                "How are you currently measuring supply chain performance?",
                "Our predictive supply chain platform has helped similar companies reduce stockouts by 35%",
              ],
            },
          },
          score_components: {
            decision_maker_score: 8.0,
            tech_investment_score: 7.2,
            growth_score: 7.8,
            ai_readiness_factor: 6.5,
          },
        },
        verification: {
          status: "Verified",
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes:
            "Verified through industry contacts. CEO is interested in potential investment.",
        },
        crm: {
          status: "Not Synced",
          date: null,
          crm_id: null,
        },
        investment_match: {
          overall_match: 92,
          match_tier: "Strong Match",
          confidence: 90,
          business_criteria: { score: 95 },
          industry_criteria: { score: 85 },
          financial_criteria: { score: 95 },
          key_strengths: [
            "Revenue in target range ($5-50M)",
            "Cash flow in target range ($1-5M)",
            "EBITDA margin >15%",
            "B2B service-based business",
            "Owner seeking exit",
          ],
          key_concerns: ["Verify recurring revenue details"],
          data_completeness: {
            financial: 85,
            business: 90,
            industry: 80,
          },
        },
        financials: {
          estimated_revenue: 12000000, // $12M
          recurring_revenue_percentage: 70,
          estimated_annual_cash_flow: 2200000, // $2.2M
          profitability_years: 5,
          ebitda_margin: 18.5,
          capex_requirements: "low",
        },
        business_details: {
          market_position: "moderate",
          customer_diversity: "diverse",
          operations_complexity: "straightforward",
          middle_management_strength: "strong",
          owner_status: "seeking_exit",
        },
        industry_details: {
          industry_type: "Supply Chain Management",
          recurring_revenue_model: "strong",
          b2b_percentage: 100,
          competitive_landscape: "fragmented",
          total_market_size: 8000000000, // $8B
          market_growth_rate: 15,
        },
      },
    ];

    // Save to localStorage
    localStorage.setItem("savedLeads", JSON.stringify(sampleLeads));
    console.log("Sample leads initialized");

    return sampleLeads;
  }

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
        `Successfully exported ${
          leads.length
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
    if (fields.assessment.investmentMatch) headers.push("Investment Match");

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
      if (fields.company.industry) {
        const industry =
          lead.industry_details?.industry_type || "Software & Technology";
        row.push(`"${industry}"`);
      }
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

      if (fields.assessment.investmentMatch) {
        const match = lead.investment_match?.overall_match || 0;
        const tier = lead.investment_match?.match_tier || "Not Evaluated";
        row.push(`"${match}% - ${tier}"`);
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
        filteredLead.company.industry =
          lead.industry_details?.industry_type || "Software & Technology";
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

      if (fields.assessment.investmentMatch && lead.investment_match) {
        filteredLead.assessment.investmentMatch = {
          score: lead.investment_match.overall_match,
          tier: lead.investment_match.match_tier,
          strengths: lead.investment_match.key_strengths,
          concerns: lead.investment_match.key_concerns,
        };
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

  // Function to load saved settings
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

  // Initialize the page
  initBackendHandlers();

  // Add investment criteria filter functionality
  // Setup investment criteria filter sliders (if they exist)
  const revenueMinSlider = document.getElementById("revenue-range-min");
  const revenueMaxSlider = document.getElementById("revenue-range-max");
  const cashFlowMinSlider = document.getElementById("cash-flow-range-min");
  const cashFlowMaxSlider = document.getElementById("cash-flow-range-max");
  const ebitdaSlider = document.getElementById("ebitda-slider");

  if (revenueMinSlider && revenueMaxSlider) {
    setupRangeSlider(
      revenueMinSlider,
      revenueMaxSlider,
      document.getElementById("revenue-min"),
      document.getElementById("revenue-max"),
      "M"
    );
  }

  if (cashFlowMinSlider && cashFlowMaxSlider) {
    setupRangeSlider(
      cashFlowMinSlider,
      cashFlowMaxSlider,
      document.getElementById("cash-flow-min"),
      document.getElementById("cash-flow-max"),
      "M"
    );
  }

  if (ebitdaSlider) {
    ebitdaSlider.addEventListener("input", () => {
      document.getElementById("ebitda-min").textContent = ebitdaSlider.value;
    });
  }

  // Helper function to setup range sliders
  function setupRangeSlider(
    minSlider,
    maxSlider,
    minDisplay,
    maxDisplay,
    suffix = ""
  ) {
    minSlider.addEventListener("input", () => {
      const minVal = parseInt(minSlider.value);
      const maxVal = parseInt(maxSlider.value);

      if (minVal > maxVal) {
        minSlider.value = maxVal;
        minDisplay.textContent = `${maxVal}${suffix}`;
      } else {
        minDisplay.textContent = `${minVal}${suffix}`;
      }
    });

    maxSlider.addEventListener("input", () => {
      const minVal = parseInt(minSlider.value);
      const maxVal = parseInt(maxSlider.value);

      if (maxVal < minVal) {
        maxSlider.value = minVal;
        maxDisplay.textContent = `${minVal}${suffix}`;
      } else {
        maxDisplay.textContent = `${maxVal}${suffix}`;
      }
    });
  }

  async function loadFinancialData(fileName = "monthly_profits.csv") {
    try {
      // Show loading state
      const resultsSection = document.getElementById("results-section");
      if (resultsSection) {
        const loadingElement = document.createElement("div");
        loadingElement.className = "loading-container";
        loadingElement.innerHTML = `
        <div class="spinner"></div>
        <p>Loading financial data...</p>
      `;
        resultsSection.appendChild(loadingElement);
      }

      // Fetch financial data from server
      const response = await fetch(`/get-financial-data?file=${fileName}`);
      const result = await response.json();

      if (result.error) {
        showError(`Failed to load financial data: ${result.error}`);
        return null;
      }

      // Parse CSV data
      return result.data;
    } catch (error) {
      console.error("Error loading financial data:", error);
      showError(`Failed to load financial data: ${error.message}`);
      return null;
    } finally {
      // Remove loading element
      const loadingElements = document.querySelectorAll(".loading-container");
      loadingElements.forEach((el) => el.remove());
    }
  }

  // Function to parse CSV data
  function parseCSV(csvText) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [",", "\t", "|", ";"],
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error("CSV parsing errors:", results.errors);
            reject(new Error("Error parsing CSV data"));
            return;
          }
          resolve(results.data);
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          reject(error);
        },
      });
    });
  }

  // Function to prepare data for chart visualization
  function prepareChartData(data, dateKey = "Date", valueKey = "Profit") {
    // Group data by month
    const groupedData = _.groupBy(data, (row) => {
      if (!row[dateKey]) return "Unknown";
      const date = new Date(row[dateKey]);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    });

    // Calculate total by month
    const chartData = _.map(groupedData, (group, yearMonth) => ({
      yearMonth,
      totalValue: _.sumBy(group, valueKey),
    }));

    // Sort data by date
    return _.sortBy(chartData, "yearMonth");
  }

  // Enhanced version of the MonthlyProfitChart React component
  const MonthlyProfitChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchData = async () => {
        try {
          setLoading(true);

          // Fetch data from server
          const csvData = await loadFinancialData("monthly_profits.csv");
          if (!csvData) {
            setError("Failed to load financial data");
            setLoading(false);
            return;
          }

          // Parse CSV data
          const parsedData = await parseCSV(csvData);

          // Prepare data for chart
          const chartData = prepareChartData(parsedData, "Date", "Profit");

          setData(chartData);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching financial data:", error);
          setError(`Error: ${error.message}`);
          setLoading(false);
        }
      };

      fetchData();
    }, []);

    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading financial data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="empty-state">
          <p>No financial data available</p>
        </div>
      );
    }

    return (
      <div className="chart-container">
        <h3>Monthly Profit Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="yearMonth"
              tickFormatter={(value) => {
                const [year, month] = value.split("-");
                return `${month}/${year.slice(2)}`;
              }}
            />
            <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <Tooltip
              formatter={(value) => [`$${value.toLocaleString()}`, "Profit"]}
              labelFormatter={(value) => {
                const [year, month] = value.split("-");
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return date.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                });
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="totalValue"
              name="Monthly Profit"
              stroke="#4f46e5"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Add a button to show financial data visualization
  function addFinancialDataButton() {
    // Check if we're on the results page
    const resultsSection = document.getElementById("results-section");
    if (!resultsSection || resultsSection.style.display === "none") return;

    // Check if button already exists
    if (document.getElementById("show-financial-data-btn")) return;

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "financial-data-actions";
    buttonContainer.style.margin = "2rem 0";
    buttonContainer.style.textAlign = "center";

    // Create button
    const button = document.createElement("button");
    button.id = "show-financial-data-btn";
    button.className = "action-btn";
    button.innerHTML =
      '<i class="fas fa-chart-line"></i> Show Financial Analysis';

    // Add event listener
    button.addEventListener("click", showFinancialDataVisualization);

    // Add to page
    buttonContainer.appendChild(button);
    resultsSection.appendChild(buttonContainer);
  }

  // Function to show financial data visualization
  async function showFinancialDataVisualization() {
    // Show loading
    const resultsElement = document.getElementById("results");
    if (!resultsElement) return;

    const loadingElement = document.createElement("div");
    loadingElement.className = "loading-container";
    loadingElement.innerHTML = `
    <div class="spinner"></div>
    <p>Preparing financial analysis...</p>
  `;
    resultsElement.appendChild(loadingElement);

    try {
      // First, ensure we have sample data
      await fetch("/generate-sample-data");

      // Create financial dashboard section
      const dashboardSection = document.createElement("div");
      dashboardSection.className = "dashboard-section";
      dashboardSection.innerHTML = `
      <div class="section-header">
        <i class="fas fa-chart-line"></i>
        <h3>Financial Analysis</h3>
      </div>
      <div id="financial-visualization-container" class="financial-container"></div>
    `;

      // Add to results
      resultsElement.appendChild(dashboardSection);

      // Remove loading
      loadingElement.remove();

      // Render the React component
      const reactRoot = ReactDOM.createRoot(
        document.getElementById("financial-visualization-container")
      );
      reactRoot.render(React.createElement(MonthlyProfitChart));
    } catch (error) {
      console.error("Error showing financial visualization:", error);
      loadingElement.remove();
      showError(`Failed to show financial analysis: ${error.message}`);
    }
  }

  // Add the financial button when results are displayed
  document.addEventListener("DOMContentLoaded", () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style" &&
          mutation.target.id === "results-section" &&
          mutation.target.style.display !== "none"
        ) {
          addFinancialDataButton();
        }
      });
    });

    const resultsSection = document.getElementById("results-section");
    if (resultsSection) {
      observer.observe(resultsSection, { attributes: true });
    }
  });
});