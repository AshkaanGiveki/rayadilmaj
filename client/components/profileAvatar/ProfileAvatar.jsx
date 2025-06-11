import React from "react";
import Image from "next/image";
import styles from "./ProfileAvatar.module.scss";

const ProfileAvatar = ({
  image,
  name = "",
  style = { width: '40px', height: '40px', background: 'linear-gradient(45deg, rgba(51, 51, 51, 0.667), #3339)', border: '2px solid #ccb06c'},
  fontSize = '0.9rem'
}) => {
  const getInitials = () => {
    const words = name.trim().split(" ");
    const initials = words.slice(0, 2).map(w => w[0] || "");
    return initials.join("‌"); // Half-space character
  };

  return (
    <div className={styles.avatar} style={{ ...style }}>
      {image ? (
        <Image
          src={image}
          alt={name}
          fill
          className={styles.avatarImage}
        />
      ) : (
        <span className={styles.initials} style={{ fontSize }}>{getInitials()}</span>
      )}
    </div>
  );
};

export default ProfileAvatar;
