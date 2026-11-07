import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
    type: String,
    size: Number,
  },
  {
    _id: false,
  }
);

const artifactSchema = new mongoose.Schema(
  {
    type: {
      type: String,
    },

    title: {
      type: String,
    },

    content: {
      type: String,
    },

    url: {
      type: String,
    },
  },
  {
    _id: false,
  }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    images: {
      type: [String],
      default: [],
    },

    files: {
      type: [fileSchema],
      default: [],
    },

    artifacts: {
      type: [artifactSchema],
      title:String,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;