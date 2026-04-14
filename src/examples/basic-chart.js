const unit = new Bimp(
  9,
  10,
  [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ],
  [
    { color: "#fbacda", label: "miss" },
    { color: "#08ccab", label: "front knit" },
    { color: "#eb4034", label: "front tuck" },
    { color: "#079e85", label: "back knit" },
    { color: "#b03027", label: "back tuck" },
    { color: "#fcff46", label: "ftb xfer" },
    { color: "#afff46", label: "btf xfer" },
    { color: "#d48cff", label: "front drop" },
    { color: "#8050c0", label: "back drop" },
    { color: "#1a1a1a", label: "empty" },
  ],
);

return {
  ops: unit,
  yarnFeeder: new Array(unit.height).fill(1),
  palette: ["#b59fd5"],
};
