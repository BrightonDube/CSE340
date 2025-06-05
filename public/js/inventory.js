'use strict'

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded');
  
  // Get DOM elements
  const classificationSelect = document.querySelector("#classification_id");
  const inventoryDisplay = document.getElementById("inventoryDisplay");
  const inventoryCards = document.getElementById("inventoryCards");
  const loadingText = document.querySelector(".loading-text");
  const errorText = document.querySelector(".error-text");
  
  if (!classificationSelect) {
    console.error('Could not find element with ID "classification_id"');
    return;
  }
  
  // Check if we're on a mobile device
  const isMobile = window.innerWidth < 768;
  
  // Show/hide table or cards based on screen size
  function updateView() {
    const isMobileView = window.innerWidth < 768;
    if (inventoryDisplay) inventoryDisplay.style.display = isMobileView ? 'none' : 'table';
    if (inventoryCards) inventoryCards.style.display = isMobileView ? 'grid' : 'none';
  }
  
  // Initial view setup
  updateView();
  window.addEventListener('resize', updateView);
  
  // Function to build the desktop table view
  function buildInventoryTable(data) {
    if (!inventoryDisplay) return;
    
    let tableHTML = `
      <thead>
        <tr>
          <th>Vehicle Name</th>
          <th>Modify</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    if (!data || data.length === 0) {
      tableHTML += `
        <tr>
          <td colspan="3" class="text-center">No inventory items found for this classification.</td>
        </tr>
      `;
    } else {
      data.forEach(item => {
        tableHTML += `
          <tr>
            <td>${escapeHtml(item.inv_make)} ${escapeHtml(item.inv_model)}</td>
            <td><a href="/inv/edit/${item.inv_id}" class="action-btn modify">Modify</a></td>
            <td><a href="/inv/delete/${item.inv_id}" class="action-btn delete">Delete</a></td>
          </tr>
        `;
      });
    }
    
    tableHTML += '</tbody>';
    inventoryDisplay.innerHTML = tableHTML;
  }
  
  // Function to build the mobile card view
  function buildInventoryCards(data) {
    if (!inventoryCards) return;
    
    if (!data || data.length === 0) {
      inventoryCards.innerHTML = `
        <div class="inventory-card">
          <div class="card-row">
            <div class="card-value">No inventory items found for this classification.</div>
          </div>
        </div>
      `;
      return;
    }
    
    let cardsHTML = '';
    
    data.forEach(item => {
      cardsHTML += `
        <div class="inventory-card">
          <div class="card-row">
            <span class="card-label">Vehicle:</span>
            <span class="card-value">${escapeHtml(item.inv_make)} ${escapeHtml(item.inv_model)}</span>
          </div>
          <div class="card-actions">
            <a href="/inv/edit/${item.inv_id}" class="action-btn modify">Modify</a>
            <a href="/inv/delete/${item.inv_id}" class="action-btn delete">Delete</a>
          </div>
        </div>
      `;
    });
    
    inventoryCards.innerHTML = cardsHTML;
  }
  
  // Helper function to escape HTML
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  // Add event listener for classification select change
  classificationSelect.addEventListener('change', function() {
    const classificationId = this.value;
    console.log('Classification selected:', classificationId);
    
    // Reset displays
    if (inventoryDisplay) inventoryDisplay.innerHTML = '';
    if (inventoryCards) inventoryCards.innerHTML = '';
    
    if (!classificationId) {
      console.log('No classification selected');
      return;
    }
    
    // Show loading state
    if (loadingText) loadingText.style.display = 'block';
    if (errorText) errorText.style.display = 'none';
    
    // Fetch the inventory for the selected classification
    fetch(`/inv/getInventory/classification_id/${classificationId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Received data:', data);
        buildInventoryTable(data);
        buildInventoryCards(data);
      })
      .catch(error => {
        console.error('Error fetching inventory:', error);
        if (errorText) {
          errorText.style.display = 'block';
          errorText.textContent = 'Error loading inventory. Please try again.';
        }
      })
      .finally(() => {
        if (loadingText) loadingText.style.display = 'none';
        // Update the view in case the window was resized during loading
        updateView();
      });
  });
  
  // Trigger change event if there's a pre-selected value
  if (classificationSelect.value) {
    classificationSelect.dispatchEvent(new Event('change'));
  }
  
  console.log('Inventory management script loaded');
});

// Build inventory items into HTML table components and inject into DOM 
function buildInventoryList(inventory) {
  let inventoryDisplay = document.getElementById("inventoryDisplay");
  let dataTable = '<thead>';
  dataTable += '<tr><th>Vehicle Name</th><td>&nbsp;</td><td>&nbsp;</td></tr>';
  dataTable += '</thead>';
  dataTable += '<tbody>';
  // Iterate over the inventory and populate each row
  inventory.forEach(vehicle => {
    dataTable += `<tr><td>${vehicle.inv_make} ${vehicle.inv_model} ${vehicle.inv_year}</td>`;
    dataTable += `<td><a href="/inv/edit/inv_id/${vehicle.inv_id}" title="Click to update">Modify</a></td>`;
    dataTable += `<td><a href="/inv/delete/inv_id/${vehicle.inv_id}" title="Click to delete">Delete</a></td></tr>`;
  });
  dataTable += '</tbody>';
  // Display the table in the inventory display area
  inventoryDisplay.innerHTML = dataTable;
}
