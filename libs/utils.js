function getCurrentUser(req, res) {
  return res?.locals?.oauth?.token?.user ?? req?.user;
}

export { getCurrentUser };
