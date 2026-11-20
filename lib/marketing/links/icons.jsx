import { SiInstagram, SiYoutube, SiThreads, SiTiktok } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import {
  FiMail,
  FiBookOpen,
  FiGift,
  FiDownload,
  FiEdit3,
  FiCalendar,
  FiPlayCircle,
  FiStar,
  FiHeart,
  FiLink,
} from "react-icons/fi";

const MAP = {
  instagram: SiInstagram,
  linkedin: FaLinkedin,
  youtube: SiYoutube,
  threads: SiThreads,
  tiktok: SiTiktok,
  mail: FiMail,
  book: FiBookOpen,
  gift: FiGift,
  download: FiDownload,
  pen: FiEdit3,
  calendar: FiCalendar,
  play: FiPlayCircle,
  star: FiStar,
  heart: FiHeart,
  link: FiLink,
};

export function LinkIcon({ id, size = 18 }) {
  const Icon = MAP[id];
  return Icon ? <Icon size={size} aria-hidden="true" /> : null;
}
