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
            
            // Optional: You can read the step number here if you want to connect it to D3 later!
            // const currentStepId = entry.target.getAttribute('data-step');
            // console.log("Currently looking at step:", currentStepId);
        }
    });
}, observerOptions);

// Tell the observer to watch all our text blocks
steps.forEach(step => {
    observer.observe(step);
});