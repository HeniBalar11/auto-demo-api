exports.isMaker = (req, res, next) => {
  if (req.user.role !== "maker") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Makers only",
    });
  }
  next();
};
