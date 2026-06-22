function initOrbitTimeline() {

    const stage =
        document.getElementById("orbitStage");

    const wrap =
        document.getElementById("orbitNodes");

    if (!stage || !wrap) {
        console.warn(
            "[orbit] Missing orbitStage / orbitNodes"
        );
        return;
    }

    const data = [

        {
            id: 1,
            icon: "📝",
            label: "10th CBSE",
            date: "2018",
            desc: "Scored 420/500 in CBSE board exams, securing distinction.",
            score: 84,
            scoreLabel: "84%"
        },

        {
            id: 2,
            icon: "📘",
            label: "Inter MPC",
            date: "2020",
            desc: "Achieved 985/1000 in Intermediate.",
            score: 98.5,
            scoreLabel: "98.5%"
        },

        {
            id: 3,
            icon: "🎯",
            label: "EAMCET",
            date: "2022",
            desc: "Secured strong state entrance rank.",
            score: 97,
            scoreLabel: "Top 3%"
        },

        {
            id: 4,
            icon: "📐",
            label: "JEE Mains",
            date: "2022",
            desc: "Scored 89 percentile.",
            score: 89,
            scoreLabel: "89%ile"
        },

        {
            id: 5,
            icon: "🎓",
            label: "B.Tech CGPA",
            date: "2022–26",
            desc: "Maintaining strong academic performance.",
            score: 93,
            scoreLabel: "9.3 / 10"
        }

    ];

    wrap.innerHTML = "";

    /* MOBILE FIX */
    const RADIUS =
        window.innerWidth <= 480
            ? 105
            : 175;

    let rotation = 0;

    let autoRotate = true;

    let activeId = null;

    const nodeEls = data.map(item => {

        const node =
            document.createElement("div");

        node.className =
            "orbit-node";

        node.dataset.id =
            item.id;

        node.innerHTML = `

<div class="orbit-node-dot">
${item.icon}
</div>

<div class="orbit-node-label">
${item.label}
</div>

<div class="orbit-node-card">

<div class="orbit-card-top">

<span class="orbit-card-badge">
COMPLETE
</span>

<span class="orbit-card-date">
${item.date}
</span>

</div>

<div class="orbit-card-title">
${item.label}
</div>

<div class="orbit-card-desc">
${item.desc}
</div>

<div class="orbit-card-score">
<span>Score</span>
<span>${item.scoreLabel}</span>
</div>

<div class="orbit-card-bar">
<div
class="orbit-card-bar-fill"
style="width:${item.score}%">
</div>
</div>

</div>

`;

        wrap.appendChild(node);

        node.addEventListener(
            "click",
            function (e) {

                e.stopPropagation();

                if (
                    activeId === item.id
                ) {

                    activeId = null;

                    autoRotate = true;

                }

                else {

                    activeId =
                        item.id;

                    autoRotate =
                        false;

                }

                updatePositions();

            }
        );

        return node;

    });

    function updatePositions() {

        const total =
            nodeEls.length;

        nodeEls.forEach(
            (
                node,
                i
            ) => {

                const angle =
                    (
                        (
                            i /
                            total
                        ) *
                        360
                        +
                        rotation
                    ) %
                    360;

                const rad =
                    angle *
                    Math.PI /
                    180;

                const x =
                    RADIUS *
                    Math.cos(
                        rad
                    );

                const y =
                    RADIUS *
                    Math.sin(
                        rad
                    );

                const active =
                    activeId ===
                    data[i].id;

                node.style.transform =
                    `translate(${x}px,${y}px)`;

                node.style.zIndex =
                    active
                        ? 300
                        : Math.round(
                            100 +
                            60 *
                            Math.cos(
                                rad
                            )
                        );

                node.style.opacity =
                    active
                        ? "1"
                        : "0.75";

                node.classList.toggle(
                    "is-active",
                    active
                );

            }
        );

    }

    function animate() {

        if (
            autoRotate
        ) {

            rotation += 0.18;

            updatePositions();

        }

        requestAnimationFrame(
            animate
        );

    }

    stage.addEventListener(
        "click",
        function (
            e
        ) {

            if (
                e.target ===
                stage
            ) {

                activeId =
                    null;

                autoRotate =
                    true;

                updatePositions();

            }

        }
    );

    updatePositions();

    animate();

}



if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initOrbitTimeline
    );

}

else {

    initOrbitTimeline();

}