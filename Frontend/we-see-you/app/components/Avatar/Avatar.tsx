"use client";

import { useState } from "react";
import styles from "./Avatar.module.scss";

interface AvatarProps {
  src?: string;
  firstName: string;
  lastName: string;
  size?: "small" | "large";
}

export default function Avatar({ src, firstName, lastName, size = "small" }: AvatarProps) {
  const [error, setError] = useState(false);

  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  const wrapperClass = size === "large" ? `${styles.avatarWrapper} ${styles.large}` : styles.avatarWrapper;
  const placeholderClass = size === "large" ? `${styles.avatarPlaceholder} ${styles.large}` : styles.avatarPlaceholder;

  return (
    <div className={wrapperClass}>
      {src && !error ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={`${firstName} ${lastName}`}
          className={styles.avatar}
          onError={() => setError(true)}
        />
      ) : (
        <span className={placeholderClass}>
          {initials}
        </span>
      )}
    </div>
  );
}
