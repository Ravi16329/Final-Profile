/* ===== ABOUT DOTTED SURFACE ===== */

(function () {

    const canvas =
        document.getElementById(
            'aboutSurface'
        );

    if (!canvas)
        return;

    const ctx =
        canvas.getContext(
            '2d'
        );

    let W;
    let H;

    function resize() {

        const s =
            document.getElementById(
                's2'
            );

        W =
            canvas.width =
            s.offsetWidth;

        H =
            canvas.height =
            s.offsetHeight;

    }

    resize();

    window.addEventListener(
        'resize',
        resize
    );

    const dots = [];

    const GAP = 38;

    for (
        let x = 0;
        x < 60;
        x++
    ) {

        for (
            let y = 0;
            y < 30;
            y++
        ) {

            dots.push({

                x:
                    x *
                    GAP,

                y:
                    y *
                    GAP,

                wave:
                    Math.random()
                    * 6

            });

        }

    }

    let tick = 0;

    function animate() {

        ctx.clearRect(
            0,
            0,
            W,
            H
        );

        dots.forEach(d => {

            const py =

                d.y +

                Math.sin(
                    tick +
                    d.wave +
                    d.x * .02
                )

                * 18;

            const size =

                2 +

                Math.sin(
                    tick +
                    d.wave
                );

            ctx.beginPath();

            ctx.arc(
                d.x,
                py,
                size,
                0,
                6.28
            );

            ctx.fillStyle =

                `rgba(
0,
212,
255,
${0.15 +
                size / 10
                }
)`;

            ctx.fill();

        });

        tick +=
            0.03;

        requestAnimationFrame(
            animate
        );

    }

    animate();

})();



