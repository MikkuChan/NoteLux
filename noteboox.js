// Data storage with localStorage
let dailyNotes = [];
let debtNotes = [];
let freeNotes = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    document.getElementById('dailyDate').value = new Date().toISOString().split('T')[0];

    loadData();
    displayNotes();
    updateStats();
    setupEventListeners();
    setupAutoSave();
});

function setupEventListeners() {
    // Form submissions
    document.getElementById('dailyForm').addEventListener('submit', saveDailyNote);
    document.getElementById('debtForm').addEventListener('submit', saveDebtNote);
    document.getElementById('freeForm').addEventListener('submit', saveFreeNote);

    // Search functionality
    document.getElementById('dailySearch').addEventListener('input', searchNotes);
    document.getElementById('debtSearch').addEventListener('input', searchNotes);
    document.getElementById('freeSearch').addEventListener('input', searchNotes);

    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

    // Show selected section
    document.getElementById(section).classList.add('active');
    event.target.classList.add('active');
}

function saveDailyNote(e) {
    e.preventDefault();
    const date = document.getElementById('dailyDate').value;
    const title = document.getElementById('dailyTitle').value;
    const content = document.getElementById('dailyContent').value;

    const note = {
        id: Date.now(),
        date,
        title,
        content,
        created: new Date().toLocaleString('id-ID')
    };

    dailyNotes.push(note);
    saveData();
    document.getElementById('dailyForm').reset();
    document.getElementById('dailyDate').value = new Date().toISOString().split('T')[0];
    displayNotes();
    updateStats();
    showNotification('Catatan harian berhasil disimpan!');
}

function saveDebtNote(e) {
    e.preventDefault();
    const type = document.getElementById('debtType').value;
    const person = document.getElementById('debtPerson').value;
    const amount = document.getElementById('debtAmount').value;
    const desc = document.getElementById('debtDesc').value;

    const note = {
        id: Date.now(),
        type,
        person,
        amount: parseFloat(amount),
        desc,
        status: 'pending',
        created: new Date().toLocaleString('id-ID')
    };

    debtNotes.push(note);
    saveData();
    document.getElementById('debtForm').reset();
    displayNotes();
    updateStats();
    showNotification('Catatan hutang/piutang berhasil disimpan!');
}

function saveFreeNote(e) {
    e.preventDefault();
    const category = document.getElementById('freeCategory').value;
    const title = document.getElementById('freeTitle').value;
    const content = document.getElementById('freeContent').value;

    const note = {
        id: Date.now(),
        category,
        title,
        content,
        created: new Date().toLocaleString('id-ID')
    };

    freeNotes.push(note);
    saveData();
    document.getElementById('freeForm').reset();
    displayNotes();
    updateStats();
    showNotification('Catatan bebas berhasil disimpan!');
}

function displayNotes() {
    displayDailyNotes();
    displayDebtNotes();
    displayFreeNotes();
}

function displayDailyNotes(filteredNotes = null) {
    const container = document.getElementById('dailyNotes');
    const notes = filteredNotes || dailyNotes;

    if (notes.length === 0) {
        container.innerHTML = '<div class="card" style="text-align: center; color: #666;"><i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 20px;"></i><h3>Belum ada catatan harian</h3><p>Mulai menulis catatan harian pertama Anda!</p></div>';
        return;
    }

    container.innerHTML = notes.map(note => `
        <div class="note-item">
            <div class="note-header">
                <div class="note-date">
                    <i class="fas fa-calendar"></i> ${formatDate(note.date)}
                </div>
                <div class="note-actions">
                    <button class="btn btn-sm btn-primary" onclick="editDailyNote(${note.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteNote('daily', ${note.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <h3>${note.title}</h3>
            <p>${note.content}</p>
            <small class="text-muted">Dibuat: ${note.created}</small>
        </div>
    `).join('');
}

function displayDebtNotes(filteredNotes = null) {
    const container = document.getElementById('debtNotes');
    const notes = filteredNotes || debtNotes;

    if (notes.length === 0) {
        container.innerHTML = '<div class="card" style="text-align: center; color: #666;"><i class="fas fa-money-bill-wave" style="font-size: 3rem; margin-bottom: 20px;"></i><h3>Belum ada catatan hutang/piutang</h3><p>Catat hutang dan piutang Anda di sini!</p></div>';
        return;
    }

    container.innerHTML = notes.map(note => `
        <div class="note-item">
            <div class="note-header">
                <div class="debt-status ${note.status === 'paid' ? 'status-paid' : 'status-pending'}">
                    ${note.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
                </div>
                <div class="note-actions">
                    <button class="btn btn-sm ${note.status === 'paid' ? 'btn-danger' : 'btn-success'}" onclick="toggleDebtStatus(${note.id})">
                        <i class="fas ${note.status === 'paid' ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editDebtNote(${note.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteNote('debt', ${note.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <h3>${note.type === 'hutang' ? '🔴' : '🟢'} ${note.person}</h3>
            <p><strong>Jumlah:</strong> Rp ${note.amount.toLocaleString('id-ID')}</p>
            <p><strong>Jenis:</strong> ${note.type === 'hutang' ? 'Hutang (Saya berhutang)' : 'Piutang (Saya berpiutang)'}</p>
            ${note.desc ? `<p><strong>Keterangan:</strong> ${note.desc}</p>` : ''}
            <small class="text-muted">Dibuat: ${note.created}</small>
        </div>
    `).join('');
}

function displayFreeNotes(filteredNotes = null) {
    const container = document.getElementById('freeNotes');
    const notes = filteredNotes || freeNotes;

    if (notes.length === 0) {
        container.innerHTML = '<div class="card" style="text-align: center; color: #666;"><i class="fas fa-sticky-note" style="font-size: 3rem; margin-bottom: 20px;"></i><h3>Belum ada catatan bebas</h3><p>Buat catatan untuk keperluan apapun!</p></div>';
        return;
    }

    container.innerHTML = notes.map(note => `
        <div class="note-item">
            <div class="note-header">
                <div class="category-tag">${note.category}</div>
                <div class="note-actions">
                    <button class="btn btn-sm btn-primary" onclick="editFreeNote(${note.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteNote('free', ${note.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <h3>${note.title}</h3>
            <p>${note.content}</p>
            <small class="text-muted">Dibuat: ${note.created}</small>
        </div>
    `).join('');
}

function searchNotes() {
    const dailyQuery = document.getElementById('dailySearch').value.toLowerCase();
    const debtQuery = document.getElementById('debtSearch').value.toLowerCase();
    const freeQuery = document.getElementById('freeSearch').value.toLowerCase();

    if (dailyQuery) {
        const filtered = dailyNotes.filter(note =>
            note.title.toLowerCase().includes(dailyQuery) ||
            note.content.toLowerCase().includes(dailyQuery)
        );
        displayDailyNotes(filtered);
    } else {
        displayDailyNotes();
    }

    if (debtQuery) {
        const filtered = debtNotes.filter(note =>
            note.person.toLowerCase().includes(debtQuery) ||
            note.desc.toLowerCase().includes(debtQuery) ||
            note.type.toLowerCase().includes(debtQuery)
        );
        displayDebtNotes(filtered);
    } else {
        displayDebtNotes();
    }

    if (freeQuery) {
        const filtered = freeNotes.filter(note =>
            note.title.toLowerCase().includes(freeQuery) ||
            note.content.toLowerCase().includes(freeQuery) ||
            note.category.toLowerCase().includes(freeQuery)
        );
        displayFreeNotes(filtered);
    } else {
        displayFreeNotes();
    }
}

function editDailyNote(id) {
    const note = dailyNotes.find(n => n.id === id);
    if (!note) return;

    document.getElementById('modalTitle').textContent = 'Edit Catatan Harian';
    document.getElementById('modalBody').innerHTML = `
        <form id="editDailyForm">
            <div class="form-group">
                <label for="editDailyDate">Tanggal:</label>
                <input type="date" id="editDailyDate" value="${note.date}" required>
            </div>
            <div class="form-group">
                <label for="editDailyTitle">Judul:</label>
                <input type="text" id="editDailyTitle" value="${note.title}" required>
            </div>
            <div class="form-group">
                <label for="editDailyContent">Isi Catatan:</label>
                <textarea id="editDailyContent" required>${note.content}</textarea>
            </div>
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Simpan Perubahan
            </button>
        </form>
    `;

    document.getElementById('editDailyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        note.date = document.getElementById('editDailyDate').value;
        note.title = document.getElementById('editDailyTitle').value;
        note.content = document.getElementById('editDailyContent').value;

        saveData();
        displayNotes();
        closeModal();
        showNotification('Catatan harian berhasil diperbarui!');
    });

    document.getElementById('editModal').style.display = 'block';
}

function editDebtNote(id) {
    const note = debtNotes.find(n => n.id === id);
    if (!note) return;

    document.getElementById('modalTitle').textContent = 'Edit Catatan Hutang/Piutang';
    document.getElementById('modalBody').innerHTML = `
        <form id="editDebtForm">
            <div class="form-group">
                <label for="editDebtType">Jenis:</label>
                <select id="editDebtType" required>
                    <option value="hutang" ${note.type === 'hutang' ? 'selected' : ''}>Hutang (Saya berhutang)</option>
                    <option value="piutang" ${note.type === 'piutang' ? 'selected' : ''}>Piutang (Saya berpiutang)</option>
                </select>
            </div>
            <div class="form-group">
                <label for="editDebtPerson">Nama Orang:</label>
                <input type="text" id="editDebtPerson" value="${note.person}" required>
            </div>
            <div class="form-group">
                <label for="editDebtAmount">Jumlah:</label>
                <input type="number" id="editDebtAmount" value="${note.amount}" required>
            </div>
            <div class="form-group">
                <label for="editDebtDesc">Keterangan:</label>
                <textarea id="editDebtDesc">${note.desc || ''}</textarea>
            </div>
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Simpan Perubahan
            </button>
        </form>
    `;

    document.getElementById('editDebtForm').addEventListener('submit', function(e) {
        e.preventDefault();
        note.type = document.getElementById('editDebtType').value;
        note.person = document.getElementById('editDebtPerson').value;
        note.amount = parseFloat(document.getElementById('editDebtAmount').value);
        note.desc = document.getElementById('editDebtDesc').value;

        saveData();
        displayNotes();
        closeModal();
        showNotification('Catatan hutang/piutang berhasil diperbarui!');
    });

    document.getElementById('editModal').style.display = 'block';
}

function editFreeNote(id) {
    const note = freeNotes.find(n => n.id === id);
    if (!note) return;

    document.getElementById('modalTitle').textContent = 'Edit Catatan Bebas';
    document.getElementById('modalBody').innerHTML = `
        <form id="editFreeForm">
            <div class="form-group">
                <label for="editFreeCategory">Kategori:</label>
                <input type="text" id="editFreeCategory" value="${note.category}" required>
            </div>
            <div class="form-group">
                <label for="editFreeTitle">Judul:</label>
                <input type="text" id="editFreeTitle" value="${note.title}" required>
            </div>
            <div class="form-group">
                <label for="editFreeContent">Isi Catatan:</label>
                <textarea id="editFreeContent" required>${note.content}</textarea>
            </div>
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Simpan Perubahan
            </button>
        </form>
    `;

    document.getElementById('editFreeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        note.category = document.getElementById('editFreeCategory').value;
        note.title = document.getElementById('editFreeTitle').value;
        note.content = document.getElementById('editFreeContent').value;

        saveData();
        displayNotes();
        closeModal();
        showNotification('Catatan bebas berhasil diperbarui!');
    });

    document.getElementById('editModal').style.display = 'block';
}

function toggleDebtStatus(id) {
    const note = debtNotes.find(n => n.id === id);
    if (!note) return;

    note.status = note.status === 'paid' ? 'pending' : 'paid';
    saveData();
    displayNotes();
    showNotification(`Status ${note.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'} berhasil diubah!`);
}

function deleteNote(type, id) {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) return;

    switch(type) {
        case 'daily':
            dailyNotes = dailyNotes.filter(n => n.id !== id);
            break;
        case 'debt':
            debtNotes = debtNotes.filter(n => n.id !== id);
            break;
        case 'free':
            freeNotes = freeNotes.filter(n => n.id !== id);
            break;
    }

    saveData();
    displayNotes();
    updateStats();
    showNotification('Catatan berhasil dihapus!');
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

function updateStats() {
    document.getElementById('dailyCount').textContent = dailyNotes.length;
    document.getElementById('debtCount').textContent = debtNotes.length;
    document.getElementById('freeCount').textContent = freeNotes.length;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// --- LOCAL STORAGE PERSISTENCE ---
function saveData() {
    localStorage.setItem('luxuryNotesDaily', JSON.stringify(dailyNotes));
    localStorage.setItem('luxuryNotesDebt', JSON.stringify(debtNotes));
    localStorage.setItem('luxuryNotesFree', JSON.stringify(freeNotes));
}

function loadData() {
    dailyNotes = JSON.parse(localStorage.getItem('luxuryNotesDaily')) || [];
    debtNotes = JSON.parse(localStorage.getItem('luxuryNotesDebt')) || [];
    freeNotes = JSON.parse(localStorage.getItem('luxuryNotesFree')) || [];
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                showSection('daily');
                break;
            case '2':
                e.preventDefault();
                showSection('debt');
                break;
            case '3':
                e.preventDefault();
                showSection('free');
                break;
            case 'k':
                e.preventDefault();
                const activeSection = document.querySelector('.content-section.active').id;
                document.getElementById(activeSection + 'Search').focus();
                break;
        }
    }

    if (e.key === 'Escape') {
        closeModal();
    }
});

// Auto-save draft functionality (simulated)
let draftTimer;
function setupAutoSave() {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(draftTimer);
            draftTimer = setTimeout(() => {
                // In a real app, this would save drafts to localStorage
                console.log('Draft auto-saved');
            }, 2000);
        });
    });
}
/** script about/tentang **/
function openAboutModal() {
        document.getElementById('aboutModal').style.display = 'block';
      }
      function closeAboutModal() {
        document.getElementById('aboutModal').style.display = 'none';
      }
      // Close modal jika klik di luar modal-content
      window.onclick = function(event) {
        const aboutModal = document.getElementById('aboutModal');
        if (aboutModal && event.target === aboutModal) {
          aboutModal.style.display = 'none';
        }
      }