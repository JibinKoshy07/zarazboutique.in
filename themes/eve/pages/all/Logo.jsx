import React from "react";

function Logo() {
  return (
    <div>
      <a href="/">
      <img src="/Z2-cropped.svg" alt="eve" style={{ width: "150px", height: "auto" }} />
      </a>
    </div>
  );
}

export default Logo;

export const layout = {
  areaId: "header",
  sortOrder: 5,
};
