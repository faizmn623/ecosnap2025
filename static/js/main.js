document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const uploadForm = document.getElementById('uploadForm');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = imagePreview.querySelector('img');
    const resultCard = document.getElementById('resultCard');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultContent = document.getElementById('resultContent');
    const errorMessage = document.getElementById('errorMessage');
    const wasteType = document.getElementById('wasteType');
    const wasteTypeIcon = document.getElementById('wasteTypeIcon');
    const wasteDescription = document.getElementById('wasteDescription');
    const wasteDisposal = document.getElementById('wasteDisposal');
    const wasteImpact = document.getElementById('wasteImpact');
    const historyList = document.getElementById('historyList');
    const noHistoryMessage = document.getElementById('noHistoryMessage');

    // Load history when page loads
    loadHistory();

    // Setup image preview on file select
    imageInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();

            reader.onload = function(e) {
                previewImage.setAttribute('src', e.target.result);
                imagePreview.classList.remove('d-none');
            };

            reader.readAsDataURL(this.files[0]);
        } else {
            imagePreview.classList.add('d-none');
        }
    });

    // Handle form submission
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Validate file is selected
        if (!imageInput.files || !imageInput.files[0]) {
            showError('Please select an image to classify');
            return;
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('image', imageInput.files[0]);
        formData.append('material', document.getElementById('materialInput').value);

        // Show loading and result card
        resultCard.classList.remove('d-none');
        loadingSpinner.classList.remove('d-none');
        resultContent.classList.add('d-none');
        errorMessage.classList.add('d-none');

        // Scroll to result card
        resultCard.scrollIntoView({ behavior: 'smooth' });

        // Send request to server
        fetch('/classify', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to classify image');
                });
            }
            return response.json();
        })
        .then(data => {
            // Hide loading spinner
            loadingSpinner.classList.add('d-none');

            // Show result content
            displayResult(data);
            resultContent.classList.remove('d-none');

            // Refresh history
            loadHistory();
        })
        .catch(error => {
            // Hide loading spinner
            loadingSpinner.classList.add('d-none');

            // Show error message
            showError(error.message);
        });
    });

    // Function to display classification result
    function displayResult(data) {
        wasteType.textContent = data.result;
        wasteDescription.textContent = data.description;
        wasteDisposal.textContent = data.disposal;
        wasteImpact.textContent = data.impact;

        // Update icon based on waste type
        const iconMap = {
            'Plastic': '<i class="fas fa-wine-bottle text-blue"></i>',
            'Organic': '<i class="fas fa-apple-alt text-success"></i>',
            'Metal': '<i class="fas fa-box text-secondary"></i>',
            'Paper': '<i class="fas fa-newspaper text-warning"></i>',
            'E-Waste': '<i class="fas fa-laptop text-danger"></i>'
        };

        // Add small camera icon to show it's from EcoSnap
        for (const key in iconMap) {
            iconMap[key] = iconMap[key].replace('</i>', '</i><small class="position-absolute" style="font-size: 0.5em; bottom: -5px; right: -5px;"><i class="fas fa-camera text-primary"></i></small>')
        }

        wasteTypeIcon.innerHTML = iconMap[data.result] || '<i class="fas fa-trash-alt"></i>';

        // Apply color to waste type heading
        wasteType.className = ''; // Reset classes
        wasteType.classList.add('mt-2', `text-${data.color}`);

        // If we have an explanation from AI, add it to the UI
        if (data.explanation) {
            // Check if explanation element exists, if not create it
            let explanationCard = document.getElementById('aiExplanationCard');
            if (!explanationCard) {
                // Create the explanation card
                explanationCard = document.createElement('div');
                explanationCard.id = 'aiExplanationCard';
                explanationCard.className = 'card mb-3';

                const cardHeader = document.createElement('div');
                cardHeader.className = 'card-header bg-dark';
                cardHeader.innerHTML = '<h4 class="h6 mb-0">AI Analysis</h4>';

                const cardBody = document.createElement('div');
                cardBody.className = 'card-body';

                const explanationText = document.createElement('p');
                explanationText.id = 'aiExplanation';
                explanationText.className = 'mb-2';

                const confidenceBadge = document.createElement('div');
                confidenceBadge.id = 'confidenceBadge';
                confidenceBadge.className = 'mt-2';

                cardBody.appendChild(explanationText);
                cardBody.appendChild(confidenceBadge);

                explanationCard.appendChild(cardHeader);
                explanationCard.appendChild(cardBody);

                // Insert after the environmental impact card
                const impactCard = document.querySelector('.card-body .card:last-child');
                if (impactCard) {
                    impactCard.parentNode.insertBefore(explanationCard, impactCard.nextSibling);
                } else {
                    resultContent.appendChild(explanationCard);
                }
            }

            // Update explanation text
            const explanationText = document.getElementById('aiExplanation');
            explanationText.textContent = data.explanation;

            // Update confidence badge
            const confidenceBadge = document.getElementById('confidenceBadge');
            let badgeClass = 'badge ';

            // Set badge color based on confidence
            switch(data.confidence?.toLowerCase()) {
                case 'high':
                    badgeClass += 'bg-success';
                    break;
                case 'medium':
                    badgeClass += 'bg-warning text-dark';
                    break;
                case 'low':
                    badgeClass += 'bg-danger';
                    break;
                default:
                    badgeClass += 'bg-secondary';
            }

            confidenceBadge.innerHTML = `<span class="${badgeClass}">Confidence: ${data.confidence || 'Unknown'}</span>`;
        }

        // Add Quick Facts section
        let quickFactsSection = document.createElement('div');
        quickFactsSection.className = 'card shadow-sm mb-4';
        quickFactsSection.innerHTML = `
            <div class="card-header bg-dark">
                <h5 class="mb-0"><i class="fas fa-lightbulb me-2"></i>Quick Facts</h5>
            </div>
            <div class="card-body">
                ${(data.facts || []).map(fact => `
                    <div class="quick-fact mb-3">
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-${fact.icon} text-primary me-2"></i>
                            <h5 class="mb-0">${fact.title}</h5>
                        </div>
                        <p class="mb-0">${fact.text}</p>
                    </div>
                `).join('')}
            </div>
        `;
        resultContent.appendChild(quickFactsSection);

    }

    // Function to show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
        resultContent.classList.add('d-none');
        loadingSpinner.classList.add('d-none');
        resultCard.classList.remove('d-none');
    }

    // Function to load classification history
    function loadHistory() {
        fetch('/history')
            .then(response => response.json())
            .then(data => {
                // Clear current history
                historyList.innerHTML = '';

                // If no history, show message
                if (!data.history || data.history.length === 0) {
                    noHistoryMessage.classList.remove('d-none');
                    return;
                }

                // Hide no history message
                noHistoryMessage.classList.add('d-none');

                // Add each history item
                data.history.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.className = 'list-group-item border-bottom';

                    // Determine icon for waste type
                    let icon = 'trash-alt';
                    let iconColor = 'secondary';

                    switch(item.waste_type) {
                        case 'Plastic':
                            icon = 'wine-bottle';
                            iconColor = 'primary';
                            break;
                        case 'Organic':
                            icon = 'apple-alt';
                            iconColor = 'success';
                            break;
                        case 'Metal':
                            icon = 'box';
                            iconColor = 'secondary';
                            break;
                        case 'Paper':
                            icon = 'newspaper';
                            iconColor = 'warning';
                            break;
                        case 'E-Waste':
                            icon = 'laptop';
                            iconColor = 'danger';
                            break;
                    }

                    // Create HTML content for history item
                    let historyContent = `
                        <div class="d-flex align-items-center">
                            <div class="me-3">
                                <i class="fas fa-${icon} fa-lg text-${iconColor}"></i>
                            </div>
                            <div>
                                <h6 class="mb-0">${item.waste_type}</h6>
                                <small class="text-muted">File: ${item.filename}</small>
                                <small class="d-block text-muted">${item.timestamp}</small>
                    `;

                    // Add confidence badge if available
                    if (item.confidence) {
                        let badgeClass = '';
                        switch(item.confidence.toLowerCase()) {
                            case 'high':
                                badgeClass = 'bg-success';
                                break;
                            case 'medium':
                                badgeClass = 'bg-warning text-dark';
                                break;
                            case 'low':
                                badgeClass = 'bg-danger';
                                break;
                            default:
                                badgeClass = 'bg-secondary';
                        }
                        historyContent += `<span class="badge ${badgeClass} mt-1 me-1">Confidence: ${item.confidence}</span>`;
                    }

                    historyContent += `
                            </div>
                        </div>
                    `;

                    listItem.innerHTML = historyContent;

                    historyList.appendChild(listItem);
                });
            })
            .catch(error => {
                console.error('Error loading history:', error);
            });
    }
});
// Search functionality
document.getElementById('wasteSearchInput')?.addEventListener('input', function(e) {
    const searchText = e.target.value.toLowerCase();
    document.querySelectorAll('.waste-card').forEach(card => {
        const wasteType = card.querySelector('.waste-type').textContent.toLowerCase();
        const description = card.querySelector('.waste-description').textContent.toLowerCase();
        if (wasteType.includes(searchText) || description.includes(searchText)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// Classification statistics chart
async function loadClassificationStats() {
    const response = await fetch('/classification_stats');
    const data = await response.json();
    
    const ctx = document.getElementById('classificationChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Classifications',
                data: Object.values(data),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

if (document.getElementById('classificationChart')) {
    loadClassificationStats();
}

// Function to find recycling centers
function findRecyclingCenters() {
    const location = document.getElementById('locationInput').value;
    const locationsDiv = document.getElementById('recyclingLocations');
    
    // Example recycling centers (in production, this would connect to a real API)
    const demoLocations = [
        { name: "City Recycling Center", distance: "2.3 miles", types: ["All Materials"] },
        { name: "Green Earth Recycling", distance: "3.1 miles", types: ["Plastic", "Paper"] },
        { name: "E-Waste Solutions", distance: "4.5 miles", types: ["E-Waste"] }
    ];

    let html = '<div class="list-group">';
    demoLocations.forEach(loc => {
        html += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-1">${loc.name}</h6>
                    <span class="badge bg-primary">${loc.distance}</span>
                </div>
                <p class="mb-1 small">Accepts: ${loc.types.join(", ")}</p>
            </div>`;
    });
    html += '</div>';
    
    locationsDiv.innerHTML = html;
}
