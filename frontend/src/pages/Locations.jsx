import MasterList from "./MasterList";
export default function Locations() {
  return <MasterList collection="locations" title="Ubicaciones" description="Lugares físicos donde se almacena el inventario." singular="Ubicación" singularArticle="una" />;
}
