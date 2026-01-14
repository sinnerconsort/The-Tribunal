/**
 * Inland Empire - Toast Notifications
 * All toast display functions
 */

// ═══════════════════════════════════════════════════════════════
// TOAST CONTAINER
// ═══════════════════════════════════════════════════════════════

export function createToastContainer() {
    let container = document.getElementById('ie-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ie-toast-container';
        container.className = 'ie-toast-container';
        document.body.appendChild(container);
    }
    return container;
}

// ═══════════════════════════════════════════════════════════════
// BASIC TOAST
// ═══════════════════════════════════════════════════════════════

export function showToast(message, type = 'info', duration = 3000) {
    const container = createToastContainer();
    const toast = document.createElement('div');
    toast.className = `ie-toast ie-toast-${type}`;

    const icons = {
        loading: 'fa-spinner fa-spin',
        success: 'fa-check',
        error: 'fa-exclamation-triangle',
        info: 'fa-brain'
    };

    toast.innerHTML = `
        <i class="fa-solid ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('ie-toast-show'));

    if (type !== 'loading') {
        setTimeout(() => {
            toast.classList.remove('ie-toast-show');
            toast.classList.add('ie-toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    return toast;
}

export function hideToast(toast) {
    if (toast?.parentNode) {
        toast.classList.remove('ie-toast-show');
        toast.classList.add('ie-toast-hide');
        setTimeout(() => toast.remove(), 300);
    }
}

// ═══════════════════════════════════════════════════════════════
// INTRUSIVE THOUGHT TOAST
// ═══════════════════════════════════════════════════════════════

export function showIntrusiveToast(thought, duration = 5000) {
    const container = createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'ie-toast ie-toast-intrusive';
    toast.style.borderColor = thought.color;

    toast.innerHTML = `
        <div class="ie-intrusive-header">
            <span class="ie-intrusive-icon">🧠</span>
            <span class="ie-intrusive-signature" style="color: ${thought.color}">${thought.signature}</span>
        </div>
        <div class="ie-intrusive-content">"${thought.content}"</div>
        <button class="ie-intrusive-dismiss">dismiss</button>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('ie-toast-show'));

    toast.querySelector('.ie-intrusive-dismiss')?.addEventListener('click', () => {
        toast.classList.remove('ie-toast-show');
        toast.classList.add('ie-toast-hide');
        setTimeout(() => toast.remove(), 300);
    });

    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('ie-toast-show');
            toast.classList.add('ie-toast-hide');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);

    return toast;
}

// ═══════════════════════════════════════════════════════════════
// OBJECT VOICE TOAST
// ═══════════════════════════════════════════════════════════════

export function showObjectToast(objectVoice, duration = 6000) {
    const container = createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'ie-toast ie-toast-object';
    toast.style.borderColor = objectVoice.color;

    toast.innerHTML = `
        <div class="ie-object-header">
            <span class="ie-object-icon">${objectVoice.icon}</span>
            <span class="ie-object-name" style="color: ${objectVoice.color}">${objectVoice.name}</span>
        </div>
        <div class="ie-object-content">"${objectVoice.content}"</div>
        <button class="ie-object-dismiss">dismiss</button>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('ie-toast-show'));

    toast.querySelector('.ie-object-dismiss')?.addEventListener('click', () => {
        toast.classList.remove('ie-toast-show');
        toast.classList.add('ie-toast-hide');
        setTimeout(() => toast.remove(), 300);
    });

    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('ie-toast-show');
            toast.classList.add('ie-toast-hide');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);

    return toast;
}

// ═══════════════════════════════════════════════════════════════
// THOUGHT DISCOVERY TOAST
// ═══════════════════════════════════════════════════════════════

export function showDiscoveryToast(thought, onResearch, onDismiss) {
    const container = createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'ie-toast ie-toast-discovery';

    // Get short description from problemText (first sentence) or fallback to description
    const shortDesc = thought.problemText 
        ? thought.problemText.split('\n')[0].substring(0, 100) + '...'
        : thought.description || 'A new thought emerges...';

    toast.innerHTML = `
        <div class="ie-discovery-header">
            <span class="ie-discovery-icon">💭</span>
            <span class="ie-discovery-label">THOUGHT DISCOVERED</span>
        </div>
        <div class="ie-discovery-name">${thought.icon} ${thought.name}</div>
        <div class="ie-discovery-desc">${shortDesc}</div>
        <div class="ie-discovery-actions">
            <button class="ie-btn ie-btn-research" data-thought="${thought.id}">RESEARCH</button>
            <button class="ie-btn ie-btn-dismiss-thought" data-thought="${thought.id}">DISMISS</button>
        </div>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('ie-toast-show'));

    const closeToast = () => {
        toast.classList.remove('ie-toast-show');
        toast.classList.add('ie-toast-hide');
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.ie-btn-research')?.addEventListener('click', () => {
        if (onResearch) onResearch(thought.id);
        closeToast();
    });

    toast.querySelector('.ie-btn-dismiss-thought')?.addEventListener('click', () => {
        if (onDismiss) onDismiss(thought.id);
        closeToast();
    });

    return toast;
}

// ═══════════════════════════════════════════════════════════════
// INTERNALIZED THOUGHT TOAST
// ═══════════════════════════════════════════════════════════════

export function showInternalizedToast(thought, skills = {}) {
    const container = createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'ie-toast ie-toast-internalized';

    const bonusText = thought.internalizedBonus ?
        Object.entries(thought.internalizedBonus)
            .map(([s, v]) => {
                const value = typeof v === 'object' ? v.value : v;
                return `+${value} ${skills[s]?.signature || s}`;
            })
            .join(' ') : '';

    const capText = thought.capModifier ?
        Object.entries(thought.capModifier)
            .map(([s, v]) => `+${v} ${skills[s]?.signature || s} cap`)
            .join(' ') : '';

    // Use solutionText (first line) or flavorText as fallback
    const flavorLine = thought.solutionText 
        ? thought.solutionText.split('\n')[0].substring(0, 120)
        : thought.flavorText || 'The thought has crystallized.';

    toast.innerHTML = `
        <div class="ie-internalized-header">
            <span class="ie-internalized-icon">✨</span>
            <span class="ie-internalized-label">THOUGHT INTERNALIZED</span>
        </div>
        <div class="ie-internalized-name">${thought.icon} ${thought.name}</div>
        <div class="ie-internalized-flavor">${flavorLine}</div>
        ${bonusText ? `<div class="ie-internalized-bonuses">${bonusText}</div>` : ''}
        ${capText ? `<div class="ie-internalized-caps">${capText}</div>` : ''}
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('ie-toast-show'));

    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('ie-toast-show');
            toast.classList.add('ie-toast-hide');
            setTimeout(() => toast.remove(), 300);
        }
    }, 8000);

    return toast;
}
