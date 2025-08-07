---
title: Troubleshooting
sidebar_position: 3
---

Troubleshooting FAQs
---

When developing with `gblend`, always keep the following in mind:

:::best-practice

1. **Always use Docker** for WASM builds to ensure reproducibility
2. **Follow naming conventions** for WASM contracts (PascalCase.wasm)
3. **Test locally** before deployment
4. **Verify contracts** immediately after deployment

:::

If something isn't working properly, review the troubleshooting FAQs below to find a quick solution.

## FAQ

### Build fails with Docker error

🚩 **Problem**: `gblend build` fails with Docker-related errors.

✅ **Solution**: Ensure Docker is installed and running:

```bash
# Check Docker status
docker info

# Start Docker daemon (Linux)
sudo systemctl start docker

# On macOS, start Docker Desktop application
```

### Error: "command not found: gblend"

🚩 **Problem**: `gblend` command is not recognized after installation.

✅ **Solution**:

1. Restart your terminal or run `source ~/.bashrc (or ~/.zshrc)`
2. Check installation path: `which gblend`
3. Verify PATH includes `gblend` location

### WASM contract verification fails

🚩 **Problem**: Verification fails with "contract not found" error.

✅ **Solution**: Ensure correct naming convention:

- Use PascalCase with `.wasm` extension
- Example: `my-contract` → `MyContract.wasm`

### Cannot import WASM interface in Solidity

🚩 **Problem**: Import statement fails for WASM interface.

✅ **Solution**:

1. Build the project first: `gblend build`
2. Check that interface exists: `ls out/PowerCalculator.wasm/interface.sol`
3. Use correct import path relative to your Solidity file

### First build takes too long

🚩 **Problem**: Initial build is slow.

✅ **Solution**: This is expected behavior. The first build downloads the Docker container image for reproducible WASM compilation. Subsequent builds will be faster.

### WASM contract deployment fails

🚩 **Problem**: Contract creation returns address(0).

✅ **Solution**:

1. Check WASM bytecode was generated: `ls out/PowerCalculator.wasm/`
2. Ensure sufficient gas for deployment
3. Verify network RPC URL is correct

## Still encountering issues?

If none of the above solves the issue you're facing, refer [Discord](https://discord.com/invite/fluentxyz") for discussing the issue and getting support from fellow community devs and DevRels, in the _#devs-forum_ channel.
