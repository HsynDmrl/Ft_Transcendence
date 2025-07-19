import { useEffect, useRef, useState } from "react";
import { useUser } from "../context/user/UserContext";
import GameOverPopup from "../components/game/GameOverPopup";
import { useLanguage } from "../context/language/LanguageProvider";

const canvasWidth = 800;
const canvasHeight = 400;
const paddleWidth = 10;
const paddleHeight = 80;
const ballRadius = 10;
const paddleSpeed = 8;
const ballSpeed = 5;

export default function Play() {
    const { t } = useLanguage();
    const { user } = useUser();

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const leftPaddleY = useRef(canvasHeight / 2 - paddleHeight / 2);
    const rightPaddleY = useRef(canvasHeight / 2 - paddleHeight / 2);

    const keysPressed = useRef<{ [key: string]: boolean }>({});

    const [leftScore, setLeftScore] = useState(0);
    const [rightScore, setRightScore] = useState(0);

    const ballRef = useRef({
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        dx: ballSpeed,
        dy: ballSpeed,
    });

    const [isRunning, setIsRunning] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);

    const resetBall = () => {
        ballRef.current = {
            x: canvasWidth / 2,
            y: canvasHeight / 2,
            dx: ballSpeed * (Math.random() > 0.5 ? 1 : -1),
            dy: ballSpeed * (Math.random() > 0.5 ? 1 : -1),
        };
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Orta çizgi
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(canvasWidth / 2, 0);
        ctx.lineTo(canvasWidth / 2, canvasHeight);
        ctx.strokeStyle = "#ccc";
        ctx.stroke();

        // Sol raket
        ctx.fillStyle = "#0077ff";
        ctx.fillRect(10, leftPaddleY.current, paddleWidth, paddleHeight);

        // Sağ raket
        ctx.fillStyle = "#ff6600";
        ctx.fillRect(canvasWidth - 10 - paddleWidth, rightPaddleY.current, paddleWidth, paddleHeight);

        // Top
        ctx.beginPath();
        ctx.arc(ballRef.current.x, ballRef.current.y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#333";
        ctx.fill();
        ctx.closePath();

        // Kullanıcı adı sol alt köşede
        if (user) {
            ctx.font = "18px Arial";
            ctx.fillStyle = "#0077ff";
            ctx.fillText(`${t("navbar_profile")}: ${user.displayName}`, 15, canvasHeight - 15);
        }
    };

    const update = () => {
        if (!isRunning) return;

        if (keysPressed.current["w"]) {
            leftPaddleY.current = Math.max(0, leftPaddleY.current - paddleSpeed);
        }
        if (keysPressed.current["s"]) {
            leftPaddleY.current = Math.min(canvasHeight - paddleHeight, leftPaddleY.current + paddleSpeed);
        }
        if (keysPressed.current["ArrowUp"]) {
            rightPaddleY.current = Math.max(0, rightPaddleY.current - paddleSpeed);
        }
        if (keysPressed.current["ArrowDown"]) {
            rightPaddleY.current = Math.min(canvasHeight - paddleHeight, rightPaddleY.current + paddleSpeed);
        }

        let { x, y, dx, dy } = ballRef.current;

        x += dx;
        y += dy;

        if (y + ballRadius > canvasHeight || y - ballRadius < 0) {
            dy = -dy;
        }

        if (
            x - ballRadius < 10 + paddleWidth &&
            y > leftPaddleY.current &&
            y < leftPaddleY.current + paddleHeight
        ) {
            dx = -dx;
        }

        if (
            x + ballRadius > canvasWidth - 10 - paddleWidth &&
            y > rightPaddleY.current &&
            y < rightPaddleY.current + paddleHeight
        ) {
            dx = -dx;
        }

        if (x - ballRadius < 0) {
            setRightScore((score) => {
                const newScore = score + 1;
                if (newScore >= 5) {
                    setIsRunning(false);
                    setWinner(t("game_winner_right"));
                } else {
                    resetBall();
                }
                return newScore;
            });
            return;
        } else if (x + ballRadius > canvasWidth) {
            setLeftScore((score) => {
                const newScore = score + 1;
                if (newScore >= 5) {
                    setIsRunning(false);
                    setWinner(t("game_winner_left"));
                } else {
                    resetBall();
                }
                return newScore;
            });
            return;
        }

        ballRef.current = { x, y, dx, dy };
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            update();
            draw(ctx);
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        const keyDownHandler = (e: KeyboardEvent) => {
            keysPressed.current[e.key] = true;
        };

        const keyUpHandler = (e: KeyboardEvent) => {
            keysPressed.current[e.key] = false;
        };

        window.addEventListener("keydown", keyDownHandler);
        window.addEventListener("keyup", keyUpHandler);

        return () => {
            window.removeEventListener("keydown", keyDownHandler);
            window.removeEventListener("keyup", keyUpHandler);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isRunning]);

    return (
        <div className="flex flex-col items-center mt-24 relative">
            <h1 className="text-4xl font-bold mb-6 text-blue-600">{t("game_title")}</h1>

            {/* Skorlar - oyun alanının üstünde */}
            <div className="flex justify-center space-x-20 mb-2 text-xl font-bold w-full max-w-[800px]">
                <div className="text-blue-600">{t("player1")}: {leftScore}</div>
                <div className="text-orange-500">{t("player2")}: {rightScore}</div>
            </div>

            <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="border border-gray-400 bg-white rounded-md shadow"
            />
            <p className="mt-4 text-gray-700">
                <strong>{t("game_controls")}</strong>
            </p>

            {!isRunning && !winner && (
                <button
                    onClick={() => setIsRunning(true)}
                    className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
                >
                    {t("game_start")}
                </button>
            )}

            {winner && (
                <GameOverPopup
                    winner={winner}
                    onRestart={() => {
                        setLeftScore(0);
                        setRightScore(0);
                        setWinner(null);
                        resetBall();
                        setIsRunning(true);
                    }}
                />
            )}
        </div>
    );
}
