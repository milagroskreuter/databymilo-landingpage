import { SiInstagram, SiPinterest } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { FiMail } from "react-icons/fi";

export const socials = [
  {
    name: "Instagram",
    handle: "@databymilo",
    href: "https://www.instagram.com/databymilo",
    Icon: SiInstagram,
    bg: "var(--rosa)",
    external: true,
  },
  {
    name: "Pinterest",
    handle: "@databymilo",
    href: "https://ar.pinterest.com/databymilo/",
    Icon: SiPinterest,
    bg: "#E60023",
    external: true,
  },
  {
    name: "LinkedIn",
    handle: "milagros kreuter",
    href: "https://www.linkedin.com/in/milagroskreuter/",
    Icon: FaLinkedin,
    bg: "#0A66C2",
    external: true,
  },
];

export const email = {
  name: "Email",
  handle: "databymilo@gmail.com",
  href: "mailto:databymilo@gmail.com",
  Icon: FiMail,
  bg: "#2a1520",
  external: false,
};
