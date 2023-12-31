/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import React from "react";

import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";

const ImageViewer = ({ itemData, showImageListItemBar = true }) => {
  return (
    <ImageList
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
      }}
      key={""}
    >
      {itemData.map((item) => (
        <ImageListItem key={item.img || item}>
          <Image
            src={
              item.imageSrc ? `data:image/jpeg;base64,${item.imageSrc}` : item
            }
            alt={item.imageId || "multiple"}
            loading="lazy"
            width={300}
            height={300}
          />
          {showImageListItemBar && (
            <ImageListItemBar
              cols={4}
              title={`${item.similarity?.toFixed(6)}%`}
            />
          )}
        </ImageListItem>
      ))}
    </ImageList>
  );
};

export default ImageViewer;
