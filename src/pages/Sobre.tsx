import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Sobre() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/pague-me-um-cafe", { replace: true });
  }, [navigate]);

  return null;
}