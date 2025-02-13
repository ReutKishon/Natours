const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

const signToken = (id) => {
  // @ts-ignore
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      // @ts-ignore
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  };
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

// @ts-ignore
// @ts-ignore
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1) Check if email and password exist

  if (!email || !password) {
    return next(new AppError("please provide email and password!", 400));
  }
  console.log(email, password);

  //2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select("+password");
  console.log(user);
  // @ts-ignore
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password"), 401);
  }
  //3) If valid, generate a token and send it back to the client
  // @ts-ignore
  createSendToken(user, 200, res);
});

// @ts-ignore
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

// @ts-ignore
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("You are not logged in! Please log in.", 401));
  }

  // @ts-ignore
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // @ts-ignore
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token does not exist.", 401)
    );
  }
  // @ts-ignore
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User's password has changed. Please login again.", 401)
    );
  }
  req.user = currentUser;
  next();
});

exports.restrictTo = function (...roles) {
  // @ts-ignore
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  };
};

// @ts-ignore
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("No user found with that email"), 404);
  }
  //2) Generate the random reset token
  // @ts-ignore
  const resetPasswordToken = await user.createPasswordResetToken();
  console.log({ resetPasswordToken });
  await user.save({ validateBeforeSave: false });
  //3) Send reset token to user's email

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetPasswordToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token,(valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Reset password email sent",
    });
  } catch (err) {
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("There was an error sending the email,Try again later!", 500)
    );
  }
});

// @ts-ignore
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    next(new AppError("Token is invalid or expired!", 400));
  }

  // @ts-ignore
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  if (!user) {
    return next(new AppError("No user found!"), 404);
  }
  // @ts-ignore
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Passwords do not match"), 401);
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});
