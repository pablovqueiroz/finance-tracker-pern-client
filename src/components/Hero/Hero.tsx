import styles from "./Hero.module.css"


function Hero() {
    return (
        <div className={styles.welcomeContainer}>
            <h3 className={styles.title}>
                Hello USER,
            </h3>
        </div>
    )
}
export default Hero