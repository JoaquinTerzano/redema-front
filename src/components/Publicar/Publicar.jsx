import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import * as React from 'react';

import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';
import Textarea from '@mui/joy/Textarea';
import ToggleButtonGroup from '@mui/joy/ToggleButtonGroup';
import Select, { selectClasses } from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import Autocomplete from '@mui/joy/Autocomplete';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import SvgIcon from '@mui/joy/SvgIcon';
import { styled } from '@mui/joy';

const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const marcadorIcono = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapaInteractivo({ lat, lng, setLatLng }) {
  const map = useMapEvents({
    click(e) {
      setLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng]);

  return <Marker position={[lat, lng]} icon={marcadorIcono} />;
}

export default function Publicar() {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [seleccionado, setSeleccionado] = useState('');
  const [provincias, setProvincias] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [localidades, setLocalidades] = useState([]);

  const [provinciaId, setProvinciaId] = useState('');
  const [departamentoId, setDepartamentoId] = useState('');
  const [localidadId, setLocalidadId] = useState('');
  const [coordenadas, setCoordenadas] = useState({ lat: -34.6, lng: -58.4 });

  const [etiquetas, setEtiquetas] = useState([]);
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState([]);
  
  // Estado para las imágenes
  const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/ubicacion/provincias')
      .then(res => res.json())
      .then(setProvincias)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (provinciaId) {
      fetch(`http://localhost:5000/api/ubicacion/departamentos?provincia_id=${provinciaId}`)
        .then(res => res.json())
        .then(setDepartamentos);
    } else {
      setDepartamentos([]);
      setDepartamentoId('');
    }
  }, [provinciaId]);

  useEffect(() => {
    if (departamentoId) {
      fetch(`http://localhost:5000/api/ubicacion/localidades?departamento_id=${departamentoId}`)
        .then(res => res.json())
        .then(setLocalidades);
    } else {
      setLocalidades([]);
      setLocalidadId('');
    }
  }, [departamentoId]);

  useEffect(() => {
    fetch('http://localhost:5000/api/etiquetas')
      .then(res => res.json())
      .then(data => {
        const mapped = data.map(e => ({ label: e.nombre, id: e.id }));
        setEtiquetas(mapped);

        // Asignar automáticamente Perro y Gato si existen
        const iniciales = mapped.filter(et => ['Perro', 'Gato'].includes(et.label));
        setEtiquetasSeleccionadas(iniciales);
      });
  }, []);

  const handleLocalidadChange = (id) => {
    setLocalidadId(id);
    const loc = localidades.find(l => l.id.toString() === id);
    if (loc) {
      setCoordenadas({ lat: parseFloat(loc.latitud), lng: parseFloat(loc.longitud) });
    }
  };

  // Función para manejar la selección de imágenes
  const handleImagenesChange = (event) => {
    const files = Array.from(event.target.files);
    setImagenesSeleccionadas(files);
  };

const handlePublicar = async () => {
  try {
    // 1. Preparar imágenes para enviar al endpoint del backend
    const formData = new FormData();
    imagenesSeleccionadas.forEach((img) => {
      formData.append("imagenes", img);
    });

    // 2. Subir imágenes al backend y obtener URLs
    const resImagenes = await fetch("http://localhost:5000/subir-imagenes", {
      method: "POST",
      body: formData,
    });

    if (!resImagenes.ok) throw new Error("Error al subir imágenes");

    const dataImagenes = await resImagenes.json();
    const urlsImagenes = dataImagenes.urls;
    const datos = {
      categoria: seleccionado,
      titulo: titulo,
      descripcion: descripcion,
      provincia_id: provinciaId,
      departamento_id: departamentoId,
      localidad_id: localidadId,
      coordenadas: coordenadas,
      etiquetas: etiquetasSeleccionadas.map(e => e.id), // solo IDs
      imagenes: urlsImagenes
    };
    console.log("🟢 JSON que se enviará al backend:", JSON.stringify(datos, null, 2));

  // 4. Enviar datos al backend
    const res = await fetch("http://localhost:5000/publicaciones", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    const data = await res.json();
    if (res.ok) {
      console.log("Publicación creada:", data);
      alert("✅ ¡Publicación enviada con éxito!");
    } else {
      throw new Error(data.error || "Error en el envío");
    }
    } catch (error) {
    console.error("Error al publicar:", error);
    alert("❌ Ocurrió un error al publicar");
    }
  };


  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="md" sx={{ position: 'relative' }}>
        <Box
          sx={{
            bgcolor: '#ffffff',
            height: '100vh',
            width: '100vw',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: -1,
          }}
        />
        <div>
          <h2>Crear publicación</h2>

          <ToggleButtonGroup
            value={seleccionado}
            onChange={(event, newValue) => setSeleccionado(newValue)}
            sx={{ my: 2, gap: 1, flexWrap: 'wrap' }}
            exclusive
          >
            <Button value="Adopción">Adopción</Button>
            <Button value="Búsqueda">Búsqueda</Button>
            <Button value="Encuentro">Encuentro</Button>
            <Button value="Estado Crítico">Estado Crítico</Button>
          </ToggleButtonGroup>

          <Input 
            placeholder="Título" 
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)} 
            sx={{ my: 2 }} 
          />

          <Textarea 
            placeholder="Descripción del caso…" 
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            minRows={2} 
            sx={{ mb: 2 }} 
          />

          <Select
            placeholder="Seleccioná una provincia"
            value={provinciaId || null}
            onChange={(e, val) => setProvinciaId(val)}
            indicator={<KeyboardArrowDown />}
            sx={{ width: '100%', mb: 2 }}
          >
            {provincias.map((prov) => (
              <Option key={prov.id} value={prov.id.toString()}>{prov.nombre}</Option>
            ))}
          </Select>

          <Select
            placeholder="Seleccioná un partido/departamento/comuna"
            value={departamentoId || null}
            onChange={(e, val) => setDepartamentoId(val)}
            disabled={!provinciaId}
            indicator={<KeyboardArrowDown />}
            sx={{ width: '100%', mb: 2 }}
          >
            {departamentos.map((d) => (
              <Option key={d.id} value={d.id.toString()}>{d.nombre}</Option>
            ))}
          </Select>

          <Select
            placeholder="Seleccioná una localidad"
            value={localidadId || null}
            onChange={(e, val) => handleLocalidadChange(val)}
            disabled={!departamentoId}
            indicator={<KeyboardArrowDown />}
            sx={{ width: '100%', mb: 3 }}
          >
            {localidades.map((l) => (
              <Option key={l.id} value={l.id.toString()}>{l.nombre}</Option>
            ))}
          </Select>

          <div style={{ height: '400px', marginTop: '1rem' }}>
            <MapContainer
              center={[coordenadas.lat, coordenadas.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapaInteractivo lat={coordenadas.lat} lng={coordenadas.lng} setLatLng={setCoordenadas} />
            </MapContainer>
          </div>

          <p>Latitud: {coordenadas.lat.toFixed(6)} | Longitud: {coordenadas.lng.toFixed(6)}</p>

          <FormControl id="multiple-limit-tags" sx={{ mt: 3 }}>
            <FormLabel>Etiquetas</FormLabel>
            <Autocomplete
              multiple
              placeholder="Seleccioná etiquetas"
              limitTags={3}
              options={etiquetas}
              value={etiquetasSeleccionadas}
              onChange={(event, value) => setEtiquetasSeleccionadas(value)}
              getOptionLabel={(option) => option.label}
              sx={{ width: '100%' }}
            />
          </FormControl>

          <Button
            component="label"
            role={undefined}
            tabIndex={-1}
            variant="outlined"
            color="neutral"
            startDecorator={
              <SvgIcon>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                  />
                </svg>
              </SvgIcon>
            }
          >
            Subir imágenes ({imagenesSeleccionadas.length})
            <VisuallyHiddenInput 
              type="file" 
              multiple 
              accept="image/*"
              onChange={handleImagenesChange}
            />
          </Button>
          
          {imagenesSeleccionadas.length > 0 && (
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#666' }}>
              {imagenesSeleccionadas.map(file => file.name).join(', ')}
            </p>
          )}

                    <Button
            size="lg"
            variant="solid"
            sx={{
              width: '100%',
              mt: 4,
              backgroundColor: '#F1B400',
              color: '#0D171C',
              '&:hover': {
                backgroundColor: '#d9a900',
              },
            }}
            onClick={handlePublicar}
          >
            Publicar
          </Button>
        </div>
      </Container>
    </React.Fragment>
  );
}