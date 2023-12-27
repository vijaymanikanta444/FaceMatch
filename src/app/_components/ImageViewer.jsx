/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import React from "react";

import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";

const ImageViewer = ({ itemData }) => {
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
        <ImageListItem key={item.img}>
          <Image
            src={`data:image/jpeg;base64,${item.imageSrc}`}
            alt={item.imageId}
            loading="lazy"
            width={300}
            height={300}
          />
          <ImageListItemBar
            cols={4}
            title={`${item.similarity?.toFixed(6)}%`}
          />
        </ImageListItem>
      ))}
    </ImageList>
  );
};

export default ImageViewer;
