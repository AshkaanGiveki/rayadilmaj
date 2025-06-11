import Image from "next/image";
import styles from "./Restriction.module.scss";
import stopIcon from "@/public/assets/images/forbidden.png";


const Restriction = ({ style }) => {

    return (
        <div className={styles.restricted}>
            <Image src={stopIcon} alt="403 Error" />
            <div className={`${styles.text403} barlow-condensed-thin`}>403</div>
        </div>
    );
};

export default Restriction;
