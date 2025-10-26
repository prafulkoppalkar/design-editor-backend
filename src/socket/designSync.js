const Design = require('../models/Design');

const validateDesignExists = async (designId) => {
  try {
    const design = await Design.findById(designId);
    return !!design;
  } catch (error) {
    return false;
  }
};

const updateDesignInDB = async (designId, updates) => {
  const design = await Design.findByIdAndUpdate(
    designId,
    {
      $set: {
        ...updates,
        lastModifiedAt: new Date(),
      },
      $inc: { version: 1 },
    },
    { new: true, runValidators: true }
  );
  return design;
};

const addElementToDB = async (designId, element) => {
  const design = await Design.findByIdAndUpdate(
    designId,
    {
      $push: { elements: element },
      $set: { lastModifiedAt: new Date() },
      $inc: { version: 1 },
    },
    { new: true, runValidators: true }
  );
  return design;
};

const updateElementInDB = async (designId, elementId, updates) => {
  const design = await Design.findById(designId);
  if (!design) {
    throw new Error('Design not found');
  }

  const elementIndex = design.elements.findIndex((el) => el.id === elementId);
  if (elementIndex === -1) {
    throw new Error('Element not found');
  }

  design.elements[elementIndex] = {
    ...design.elements[elementIndex],
    ...updates,
  };

  design.lastModifiedAt = new Date();
  design.version += 1;

  await design.save();
  return design;
};

const deleteElementFromDB = async (designId, elementId) => {
  const design = await Design.findById(designId);
  if (!design) {
    throw new Error('Design not found');
  }

  design.elements = design.elements.filter((el) => el.id !== elementId);
  design.lastModifiedAt = new Date();
  design.version += 1;

  await design.save();
  return design;
};

const updateCanvasBackground = async (designId, canvasBackground) => {
  return updateDesignInDB(designId, { canvasBackground });
};

const updateCanvasDimensions = async (designId, width, height) => {
  return updateDesignInDB(designId, { width, height });
};

const updateDesignName = async (designId, name) => {
  return updateDesignInDB(designId, { name });
};

module.exports = {
  validateDesignExists,
  updateDesignInDB,
  addElementToDB,
  updateElementInDB,
  deleteElementFromDB,
  updateCanvasBackground,
  updateCanvasDimensions,
  updateDesignName,
};