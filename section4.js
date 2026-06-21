(function () {
    const stack = document.getElementById("projectsStack");
    if (!stack) return;

    const cards = Array.from(stack.querySelectorAll(".project-card"));
    const counter = document.getElementById("stackCounter");
    const nextBtn = document.getElementById("nextProject");
    const N = cards.length;

    /* FRONT CARD INDEX */
    let order = cards.map((_, i) => i);

    /* COUNTER */
    let current = 1;

    function render() {
        cards.forEach(c => c.removeAttribute("data-pos"));

        order.forEach((cardIndex, pos) => {
            const card = cards[cardIndex];

            if (pos === 0) {
                card.setAttribute("data-pos", "0");
            }
            else if (pos === 1) {
                card.setAttribute("data-pos", "1");
            }
            else if (pos === 2) {
                card.setAttribute("data-pos", "2");
            }
            else {
                card.setAttribute("data-pos", "hidden");
            }
        });

        /* UPDATE NUMBER */
        if (counter) {
            counter.innerText = `${current} / ${N}`;
        }
    }

    function cycleNext() {
        const frontIndex = order[0];
        const frontCard = cards[frontIndex];

        frontCard.classList.add("is-leaving");

        setTimeout(() => {
            frontCard.classList.remove("is-leaving");

            /* MOVE CARD */
            order.push(order.shift());

            /* CHANGE COUNT */
            current++;
            if (current > N) {
                current = 1;
            }

            render();
        }, 350);
    }

    /* NEXT BUTTON */
    if (nextBtn) {
        nextBtn.addEventListener("click", cycleNext);
    }

    render();
})();