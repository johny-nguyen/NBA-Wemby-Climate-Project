// Set up an Intersection Observer to watch the text steps
const steps = document.querySelectorAll('.step');

// Options for the observer: 
// It will trigger when the text box crosses the middle of the screen
const observerOptions = {
    root: null,
    rootMargin: '-40% 0px -40% 0px', 
    threshold: 0
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Remove active class from all steps
            steps.forEach(step => step.classList.remove('is-active'));
            
            // Add active class to the current step in the middle of the screen
            entry.target.classList.add('is-active');
            
            // Read which section the user is currently looking at
            const currentStepId = entry.target.getAttribute('data-step');
            
            // Automatically switch the chart metric based on the section!
            if (currentStepId === "1") {
                document.querySelector('input[value="x3pa_per_game"]').click();
            } else if (currentStepId === "2") {
                document.querySelector('input[value="pace"]').click();
            } else if (currentStepId === "3") {
                document.querySelector('input[value="fga_per_game"]').click();
            } else if (currentStepId === "4") {
                document.querySelector('input[value="wins"]').click();
            }
        }
    });
}, observerOptions);

// Tell the observer to watch all our text blocks
steps.forEach(step => {
    observer.observe(step);
});
