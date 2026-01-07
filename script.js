document.addEventListener('mousemove', (e) => {
    const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
    const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
    
    const logo = document.querySelector('.logo');
    logo.style.transform = `translate(${moveX}px, ${moveY}px)`;
});


// Efecto de escritura para los títulos de tracks
const trackTitles = document.querySelectorAll('.track-card h3');

trackTitles.forEach(title => {
    const originalText = title.innerText;
    title.addEventListener('mouseenter', () => {
        let iterations = 0;
        const interval = setInterval(() => {
            title.innerText = originalText.split("")
                .map((char, index) => {
                    if(index < iterations) return originalText[index];
                    return String.fromCharCode(65 + Math.floor(Math.random() * 26));
                })
                .join("");
            
            if(iterations >= originalText.length) clearInterval(interval);
            iterations += 1/3;
        }, 30);
    });
});