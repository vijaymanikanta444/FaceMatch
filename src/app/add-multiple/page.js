"use client";

import React, { useState, useEffect, useCallback } from "react";
import { trpc } from "../_trpc/client";
import { Button } from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ImageViewer from "../_components/ImageViewer";

const Page = () => {
  // const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [base64Strings, setBase64Strings] = useState([]);
  const [loading, setLoading] = useState(false);

  const indexFace = trpc.indexFace.useMutation({ onSettled: () => {} });

  useEffect(() => {
    if (selectedFiles.length > 0) {
      Promise.all(selectedFiles.map((file) => handleFile(file)))
        .then((base64s) => {
          setBase64Strings(base64s);
        })
        .catch((error) => {
          setBase64Strings([]);
          console.error(error);
        });
    }
  }, [selectedFiles]);

  useEffect(() => {
    if (base64Strings.length > 0) {
      console.log({ base64Strings });
    }
  }, [base64Strings]);

  const handleFilesInput = (e) => {
    setSelectedFiles([...e.target.files]);
  };

  const handleFile = (file) => {
    return new Promise((resolve, reject) => {
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result;
          resolve(base64String);
        };
        reader.onerror = (error) => {
          reject(error);
        };
        reader.readAsDataURL(file);
      } else {
        reject(new Error("File is null or undefined"));
      }
    });
  };

  const indexImage = useCallback(async () => {
    if (base64Strings && base64Strings.length > 0) {
      setLoading(true);

      // Use Promise.all to wait for all mutations to complete
      await Promise.all(
        base64Strings.map(async (base64String) => {
          try {
            const data = await indexFace.mutate({ image: base64String });
            if (data && !data.error) {
              console.log({ sMessage: data.sMessage });
              // setSMessage(data.sMessage);
            } else if (data) {
              console.log({ eMessage: data.eMessage });
              // setEMessage(data.eMessage);
            }
          } catch (error) {
            console.log("hieee");
            // Handle errors from individual mutations
            // setEMessage("Error indexing image.");
            console.log(error);
          }
        })
      );

      setLoading(false);

      setBase64Strings([]);
    }
  }, [indexFace, base64Strings]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        justifyContent: "center",
        alignItems: "center",
        padding: "12px",
      }}
    >
      <input
        type={"file"}
        multiple
        accept="image/png, image/jpeg, image/jpg"
        onChange={handleFilesInput}
      />

      {base64Strings && base64Strings.length > 0 && (
        <>
          <Button
            onClick={indexImage}
            variant="contained"
            startIcon={<AddPhotoAlternateIcon />}
          >
            Index Multiple images
          </Button>
          <ImageViewer itemData={base64Strings} showImageListItemBar={false} />
        </>
      )}
    </div>
  );
};

export default Page;
