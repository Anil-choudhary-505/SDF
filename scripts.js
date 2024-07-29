window.addEventListener('load', function() {
    setTimeout(function() {
        document.getElementById('loader').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
        loadRecordsFromLocalStorage();
    }, 1000); // 1000 milliseconds = 1 second
});

document.getElementById('milkForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const date = document.getElementById('date').value;
    const quantity = parseFloat(document.getElementById('quantity').value);
    const time = document.getElementById('time').value;
    const source = document.getElementById('source').value;
    const notes = document.getElementById('notes').value;
    const cost = parseFloat(document.getElementById('cost').value);
    const customer = document.getElementById('customer').value;
    
    addRecord(date, quantity, time, source, notes, cost, customer);
    saveRecordsToLocalStorage();
    document.getElementById('milkForm').reset();
});

function addRecord(date, quantity, time, source, notes, cost, customer) {
    let customerSection = document.getElementById(`customer-${customer}`);
    if (!customerSection) {
        customerSection = document.createElement('div');
        customerSection.id = `customer-${customer}`;
        customerSection.className = 'customer-record';
        customerSection.innerHTML = `
            <h3>${customer}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Quantity</th>
                        <th>Time</th>
                        <th>Source</th>
                        <th>Notes</th>
                        <th>Cost</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
                <tfoot>
                    <tr>
                        <td colspan="6" style="text-align:right">Total Cost:</td>
                        <td id="total-cost">0</td>
                    </tr>
                </tfoot>
            </table>
            <button class="show-all-button" style="display: none;">Show All</button>
        `;
        document.getElementById('customerRecords').appendChild(customerSection);

        customerSection.querySelector('.show-all-button').addEventListener('click', function() {
            toggleRecordsVisibility(customerSection);
        });
    }

    const table = customerSection.getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();

    newRow.innerHTML = `
        <td>${date}</td>
        <td>${quantity}</td>
        <td>${time}</td>
        <td>${source}</td>
        <td>${notes}</td>
        <td>${cost}</td>
        <td><button class="edit-record">Edit</button></td>
    `;

    updateTotalCost(customerSection, quantity, cost, true); // Add record to the total cost

    // Add event listener for the edit button
    newRow.querySelector('.edit-record').addEventListener('click', function() {
        editRecord(this);
    });

    // Check if "Show All" button is needed
    if (table.rows.length > 3) {
        for (let i = 3; i < table.rows.length; i++) {
            table.rows[i].style.display = 'none';
        }
        customerSection.querySelector('.show-all-button').style.display = 'block';
    }
}

function updateTotalCost(customerSection, quantity, cost, isAddition) {
    const totalCostElement = customerSection.querySelector('#total-cost');
    const currentTotalCost = parseFloat(totalCostElement.innerText);
    const change = quantity * cost;
    const newTotalCost = isAddition ? currentTotalCost + change : currentTotalCost - change;
    totalCostElement.innerText = newTotalCost.toFixed(2);
}

function editRecord(button) {
    const row = button.closest('tr');
    const cells = row.getElementsByTagName('td');
    
    // Confirm with the user before editing
    const confirmEdit = confirm("You are about to edit a previously maintained record. Do you want to proceed?");
    if (!confirmEdit) return; // If user does not confirm, exit the function
    
    // Populate form with the record's current values
    document.getElementById('date').value = cells[0].innerText;
    document.getElementById('quantity').value = cells[1].innerText;
    document.getElementById('time').value = cells[2].innerText;
    document.getElementById('source').value = cells[3].innerText;
    document.getElementById('notes').value = cells[4].innerText;
    document.getElementById('cost').value = cells[5].innerText;
    
    // Deduct the amount of the existing record from the total cost
    const quantity = parseFloat(cells[1].innerText);
    const cost = parseFloat(cells[5].innerText);
    const customerSection = row.closest('.customer-record');
    updateTotalCost(customerSection, quantity, cost, false); // Subtract the record's amount
    
    // Remove the record
    row.remove();

    // Remove the event listener from the button
    button.removeEventListener('click', function() {
        editRecord(this);
    });

    // Save updated records to local storage
    saveRecordsToLocalStorage();
}

function saveRecordsToLocalStorage() {
    const customers = document.getElementsByClassName('customer-record');
    const records = {};
    
    for (let customer of customers) {
        const customerId = customer.id.replace('customer-', '');
        records[customerId] = {
            totalCost: parseFloat(customer.querySelector('#total-cost').innerText),
            records: []
        };
        const rows = customer.getElementsByTagName('tbody')[0].rows;
        
        for (let row of rows) {
            const record = {
                date: row.cells[0].innerText,
                quantity: row.cells[1].innerText,
                time: row.cells[2].innerText,
                source: row.cells[3].innerText,
                notes: row.cells[4].innerText,
                cost: row.cells[5].innerText
            };
            records[customerId].records.push(record);
        }
    }
    
    localStorage.setItem('milkRecords', JSON.stringify(records));
}

function loadRecordsFromLocalStorage() {
    const records = JSON.parse(localStorage.getItem('milkRecords'));
    if (!records) return;

    for (let customerId in records) {
        const customerRecords = records[customerId].records;
        const totalCost = records[customerId].totalCost;

        let customerSection = document.getElementById(`customer-${customerId}`);
        if (!customerSection) {
            customerSection = document.createElement('div');
            customerSection.id = `customer-${customerId}`;
            customerSection.className = 'customer-record';
            customerSection.innerHTML = `
                <h3>${customerId}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Quantity</th>
                            <th>Time</th>
                            <th>Source</th>
                            <th>Notes</th>
                            <th>Cost</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                    <tfoot>
                        <tr>
                            <td colspan="6" style="text-align:right">Total Cost:</td>
                            <td id="total-cost">${totalCost.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
                <button class="show-all-button" style="display: none;">Show All</button>
            `;
            document.getElementById('customerRecords').appendChild(customerSection);

            customerSection.querySelector('.show-all-button').addEventListener('click', function() {
                toggleRecordsVisibility(customerSection);
            });
        }

        const table = customerSection.getElementsByTagName('tbody')[0];

        for (let record of customerRecords) {
            const newRow = table.insertRow();
            newRow.innerHTML = `
                <td>${record.date}</td>
                <td>${record.quantity}</td>
                <td>${record.time}</td>
                <td>${record.source}</td>
                <td>${record.notes}</td>
                <td>${record.cost}</td>
                <td><button class="edit-record">Edit</button></td>
            `;
            newRow.querySelector('.edit-record').addEventListener('click', function() {
                editRecord(this);
            });
        }

        // Check if "Show All" button is needed
        if (table.rows.length > 3) {
            for (let i = 3; i < table.rows.length; i++) {
                table.rows[i].style.display = 'none';
            }
            customerSection.querySelector('.show-all-button').style.display = 'block';
        }
    }
}

document.getElementById('backupButton').addEventListener('click', function() {
    const customers = document.getElementsByClassName('customer-record');
    const records = {};
    
    for (let customer of customers) {
        const customerId = customer.id.replace('customer-', '');
        records[customerId] = {
            totalCost: parseFloat(customer.querySelector('#total-cost').innerText),
            records: []
        };
        const rows = customer.getElementsByTagName('tbody')[0].rows;
        
        for (let row of rows) {
            const record = {
                date: row.cells[0].innerText,
                quantity: row.cells[1].innerText,
                time: row.cells[2].innerText,
                source: row.cells[3].innerText,
                notes: row.cells[4].innerText,
                cost: row.cells[5].innerText
            };
            records[customerId].records.push(record);
        }
    }
    
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'milk_records_backup.json';
    link.click();
});

function showSidebar(){
    const sidebar = document.querySelector('.sidebar')
    sidebar.style.display = 'flex'
  }
  function hideSidebar(){
    const sidebar = document.querySelector('.sidebar')
    sidebar.style.display = 'none'
  } 
  function toggleRecordsVisibility(customerSection) {
    const rows = customerSection.getElementsByTagName('tbody')[0].rows;
    const showAllButton = customerSection.querySelector('.show-all-button');

    if (showAllButton.innerText === 'Show All') {
        for (let i = 3; i < rows.length; i++) {
            rows[i].style.display = 'table-row';
        }
        showAllButton.innerText = 'Show Less';
    } else {
        for (let i = 3; i < rows.length; i++) {
            rows[i].style.display = 'none';
        }
        showAllButton.innerText = 'Show All';
    }
}