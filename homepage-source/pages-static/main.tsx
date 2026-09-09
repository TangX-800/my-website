import { createRoot } from "react-dom/client";
import Home from "../app/page";
import "../app/globals.css";

// GitHub Pages 使用同一份主页组件，无需服务端运行环境。
createRoot(document.getElementById("root")!).render(<Home />);
