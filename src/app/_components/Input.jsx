"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "../_trpc/client";
import ImageViewer from "./ImageViewer";
import CircularProgress from "@mui/material/CircularProgress";

import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";

import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CompareIcon from "@mui/icons-material/Compare";
import FiberNewIcon from "@mui/icons-material/FiberNew";

import MuiAlert from "@mui/material/Alert";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Input = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [base64String, setBase64String] = useState(null);
  const [resizedBase64String, setResizedBase64String] = useState(null);

  const [loading, setLoading] = useState(false);
  const [sMessage, setSMessage] = useState("");
  const [eMessage, setEMessage] = useState("");
  const [matchingImages, setMatchingImages] = useState([]);

  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const fileInputRef = useRef(null);

  // getting the data regarding the image
  const indexFace = trpc.indexFace.useMutation({ onSettled: () => {} });
  const searchFaceByImage = trpc.searchFaceByImage.useMutation({
    onSettled: () => {},
  });

  useEffect(() => {
    setTimeout(() => {
      setEMessage("");
      setSMessage("");
    }, 5000);
  }, [sMessage, eMessage]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFile(file);
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    handleFile(file);
  };

  const handleFile = (file) => {
    if (file) {
      // Use FileReader to convert the file to a Base64 string
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setSelectedFile(file);
        setBase64String(base64String);

        // Use an Image object to get the dimensions of the image
        const img = document.createElement("img");
        img.src = base64String;

        img.onload = () => {
          setImageDimensions({
            width: img.width,
            height: img.height,
          });
          // Resize the image while maintaining resolution
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = 200; // Set the desired width
          canvas.height = (img.height / img.width) * canvas.width;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Get the resized image as a base64 string
          const resizedBase64String = canvas.toDataURL("image/jpeg"); // You can change the format if needed

          setResizedBase64String(resizedBase64String);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDivClick = () => {
    setMatchingImages([]);
    // Programatically trigger the click event on the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const indexImage = useCallback(async () => {
    if (base64String) {
      setLoading(true);
      await indexFace.mutate(
        { image: base64String },
        {
          onSettled: (data) => {
            if (!data.error) {
              setSMessage(data.sMessage);
            } else if (data.error) {
              setEMessage(data.eMessage);
            }
            setLoading(false);
          },
        }
      );
    }
  }, [indexFace, base64String]);

  const searchImage = useCallback(async () => {
    if (base64String) {
      setLoading(true);
      setMatchingImages([]);

      await searchFaceByImage.mutate(
        { image: base64String },
        {
          onSettled: (data) => {
            if (!data.error) {
              setMatchingImages(data.images);
              setSMessage(data.sMessage);
            } else if (data.error) {
              setEMessage(data.eMessage);
            }
            setLoading(false);
          },
        }
      );
    }
  }, [searchFaceByImage, base64String]);

  // Cleanup the URL when the component is unmounted or when the file changes
  useEffect(() => {
    return () => {
      if (base64String) {
        URL.revokeObjectURL(base64String);
      }
    };
  }, [base64String]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <input
        type="file"
        onChange={handleFileChange}
        style={{ display: "none" }}
        id="fileInput"
        ref={fileInputRef}
      />
      {!resizedBase64String ? (
        <div
          onClick={handleDivClick}
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          style={{
            border: "2px dashed #000",
            padding: "10px",
            textAlign: "center",
            cursor: "pointer",
            width: "300px",
            borderRadius: "16px",
            boxShadow: "5px 5px 2px #888888",
            transition: "transform 0.3s",
          }}
        >
          <p>Click or drag file to this area to upload</p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <p>Picture to compare</p>
            <Image
              src={resizedBase64String}
              alt="Uploaded"
              width={300}
              height={300}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button
              onClick={searchImage}
              variant="contained"
              startIcon={<CompareIcon />}
              color="success"
            >
              search
            </Button>
            <Button
              type="file"
              variant="contained"
              onClick={handleDivClick}
              startIcon={<FiberNewIcon />}
            >
              New Image
            </Button>
            <Button
              onClick={indexImage}
              variant="contained"
              startIcon={<AddPhotoAlternateIcon />}
            >
              Index
            </Button>
          </div>
        </>
      )}

      <Snackbar open={!!sMessage || !!eMessage} autoHideDuration={5000}>
        <Alert severity={eMessage ? "error" : "success"} sx={{ width: "100%" }}>
          {sMessage === "hey...!, here are the results" &&
          matchingImages.length === 0
            ? "There are no results to show, try with another image"
            : sMessage || eMessage}
        </Alert>
      </Snackbar>

      {loading ? (
        <CircularProgress />
      ) : (
        matchingImages &&
        matchingImages.length > 0 &&
        !eMessage && (
          <>
            <ImageViewer itemData={matchingImages} />
          </>
        )
      )}
    </div>
  );
};

export default Input;
